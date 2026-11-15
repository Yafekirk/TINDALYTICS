-- Phase 5: atomic inventory stock movements (managers only)

create or replace function public.apply_inventory_movement(
  target_store_id uuid,
  target_product_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_notes text default null,
  p_set_quantity numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_qty numeric(12, 2);
  next_qty numeric(12, 2);
  delta numeric(12, 2);
  inventory_id uuid;
  movement_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_manager(target_store_id) then
    raise exception 'Only store owners or managers can change inventory';
  end if;

  if p_movement_type not in ('stock_in', 'stock_out', 'adjustment') then
    raise exception 'Invalid movement type';
  end if;

  if not exists (
    select 1
    from public.products p
    where p.id = target_product_id
      and p.store_id = target_store_id
      and p.archived_at is null
  ) then
    raise exception 'Product not found in this store';
  end if;

  select i.id, i.quantity
  into inventory_id, current_qty
  from public.inventory i
  where i.store_id = target_store_id
    and i.product_id = target_product_id
  for update;

  if inventory_id is null then
    insert into public.inventory (store_id, product_id, quantity)
    values (target_store_id, target_product_id, 0)
    returning id, quantity into inventory_id, current_qty;
  end if;

  if p_movement_type = 'stock_in' then
    if p_quantity is null or p_quantity <= 0 then
      raise exception 'Stock-in quantity must be greater than zero';
    end if;
    delta := p_quantity;
    next_qty := current_qty + p_quantity;
  elsif p_movement_type = 'stock_out' then
    if p_quantity is null or p_quantity <= 0 then
      raise exception 'Stock-out quantity must be greater than zero';
    end if;
    if current_qty < p_quantity then
      raise exception 'Insufficient stock for stock-out';
    end if;
    delta := -p_quantity;
    next_qty := current_qty - p_quantity;
  else
    -- adjustment: set absolute quantity
    if p_set_quantity is null or p_set_quantity < 0 then
      raise exception 'Adjusted quantity cannot be negative';
    end if;
    next_qty := p_set_quantity;
    delta := next_qty - current_qty;
    if delta = 0 then
      raise exception 'No stock change to record';
    end if;
  end if;

  update public.inventory
  set quantity = next_qty
  where id = inventory_id;

  insert into public.inventory_movements (
    store_id,
    product_id,
    movement_type,
    quantity,
    reference_type,
    notes,
    created_by
  )
  values (
    target_store_id,
    target_product_id,
    p_movement_type,
    delta,
    'manual',
    nullif(trim(coalesce(p_notes, '')), ''),
    current_user_id
  )
  returning id into movement_id;

  return jsonb_build_object(
    'inventory_id', inventory_id,
    'movement_id', movement_id,
    'previous_quantity', current_qty,
    'quantity', next_qty,
    'delta', delta,
    'movement_type', p_movement_type
  );
end;
$$;

revoke all on function public.apply_inventory_movement(uuid, uuid, text, numeric, text, numeric) from public;
revoke all on function public.apply_inventory_movement(uuid, uuid, text, numeric, text, numeric) from anon;
grant execute on function public.apply_inventory_movement(uuid, uuid, text, numeric, text, numeric) to authenticated;

-- Manual stock rows are manager-only; operational types stay available to members
-- (POS / receiving will primarily use security-definer RPCs).
drop policy if exists "Members can insert inventory movements" on public.inventory_movements;

create policy "Managers can insert manual inventory movements"
  on public.inventory_movements for insert
  to authenticated
  with check (
    public.is_store_manager(store_id)
    and movement_type in ('stock_in', 'stock_out', 'adjustment')
  );

create policy "Members can insert operational inventory movements"
  on public.inventory_movements for insert
  to authenticated
  with check (
    public.is_store_member(store_id)
    and movement_type in ('sale', 'refund', 'purchase_receive')
  );
