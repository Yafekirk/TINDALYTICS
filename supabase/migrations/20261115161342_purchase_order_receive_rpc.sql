-- Phase 8: purchase order numbers + atomic receiving

alter table public.purchase_orders
  add column if not exists po_number text;

update public.purchase_orders
set po_number = 'PO-' || to_char(created_at at time zone 'Asia/Manila', 'YYYYMMDD') || '-' || substr(id::text, 1, 4)
where po_number is null;

alter table public.purchase_orders
  alter column po_number set not null;

create unique index if not exists purchase_orders_store_po_number_uidx
  on public.purchase_orders (store_id, po_number);

create index if not exists purchase_orders_store_status_idx
  on public.purchase_orders (store_id, status);

create index if not exists purchase_orders_store_supplier_id_idx
  on public.purchase_orders (store_id, supplier_id);

-- Allow managers to delete draft POs / replace draft line items
drop policy if exists "Managers can delete purchase orders" on public.purchase_orders;
create policy "Managers can delete purchase orders"
  on public.purchase_orders for delete to authenticated
  using (public.is_store_manager(store_id));

drop policy if exists "Managers can delete purchase order items" on public.purchase_order_items;
create policy "Managers can delete purchase order items"
  on public.purchase_order_items for delete to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and public.is_store_manager(po.store_id)
    )
  );

create or replace function public.receive_purchase_order(
  target_store_id uuid,
  target_po_id uuid,
  receive_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  po_rec record;
  item jsonb;
  item_rec record;
  qty_to_receive numeric(12, 2);
  remaining numeric(12, 2);
  received_lines int := 0;
  all_received boolean := true;
  any_received boolean := false;
  line_count int := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_manager(target_store_id) then
    raise exception 'Only owners or managers can receive purchase orders';
  end if;

  if receive_items is null
    or jsonb_typeof(receive_items) <> 'array'
    or jsonb_array_length(receive_items) = 0 then
    raise exception 'No items to receive';
  end if;

  select
    po.id,
    po.store_id,
    po.status,
    po.po_number
  into po_rec
  from public.purchase_orders po
  where po.id = target_po_id
    and po.store_id = target_store_id
  for update;

  if po_rec.id is null then
    raise exception 'Purchase order not found';
  end if;

  if po_rec.status not in ('ordered', 'partially_received') then
    raise exception 'Only ordered purchase orders can be received';
  end if;

  for item in select * from jsonb_array_elements(receive_items)
  loop
    qty_to_receive := nullif(item->>'quantity', '')::numeric;
    if qty_to_receive is null or qty_to_receive <= 0 then
      raise exception 'Receive quantity must be greater than zero';
    end if;

    select
      poi.id,
      poi.product_id,
      poi.quantity,
      poi.received_quantity,
      p.name as product_name
    into item_rec
    from public.purchase_order_items poi
    join public.products p on p.id = poi.product_id
    where poi.id = (item->>'item_id')::uuid
      and poi.purchase_order_id = po_rec.id
    for update of poi;

    if item_rec.id is null then
      raise exception 'Purchase order item not found';
    end if;

    remaining := item_rec.quantity - item_rec.received_quantity;
    if qty_to_receive > remaining then
      raise exception
        'Cannot receive more than remaining quantity for % (remaining: %)',
        item_rec.product_name,
        remaining;
    end if;

    update public.purchase_order_items
    set received_quantity = received_quantity + qty_to_receive
    where id = item_rec.id;

    update public.inventory
    set quantity = quantity + qty_to_receive
    where store_id = target_store_id
      and product_id = item_rec.product_id;

    if not found then
      insert into public.inventory (store_id, product_id, quantity)
      values (target_store_id, item_rec.product_id, qty_to_receive);
    end if;

    insert into public.inventory_movements (
      store_id,
      product_id,
      movement_type,
      quantity,
      reference_type,
      reference_id,
      notes,
      created_by
    ) values (
      target_store_id,
      item_rec.product_id,
      'purchase_receive',
      qty_to_receive,
      'purchase_order',
      po_rec.id,
      'Received from ' || po_rec.po_number || ' - ' || item_rec.product_name,
      current_user_id
    );

    received_lines := received_lines + 1;
  end loop;

  for item_rec in
    select quantity, received_quantity
    from public.purchase_order_items
    where purchase_order_id = po_rec.id
  loop
    line_count := line_count + 1;
    if item_rec.received_quantity > 0 then
      any_received := true;
    end if;
    if item_rec.received_quantity < item_rec.quantity then
      all_received := false;
    end if;
  end loop;

  if line_count = 0 then
    raise exception 'Purchase order has no items';
  end if;

  update public.purchase_orders
  set status = case
    when all_received then 'received'
    when any_received then 'partially_received'
    else status
  end
  where id = po_rec.id
  returning status into po_rec.status;

  return jsonb_build_object(
    'purchase_order_id', po_rec.id,
    'po_number', po_rec.po_number,
    'status', po_rec.status,
    'received_lines', received_lines
  );
end;
$$;

revoke all on function public.receive_purchase_order(uuid, uuid, jsonb) from public;
revoke all on function public.receive_purchase_order(uuid, uuid, jsonb) from anon;
grant execute on function public.receive_purchase_order(uuid, uuid, jsonb) to authenticated;
