-- Phase 6: atomic POS checkout + idempotency

alter table public.sales
  add column if not exists idempotency_key text;

create unique index if not exists sales_store_idempotency_key_uidx
  on public.sales (store_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.pos_checkout(
  target_store_id uuid,
  cart_items jsonb,
  p_payment_method text,
  p_cash_received numeric default null,
  p_discount numeric default 0,
  p_customer_id uuid default null,
  p_notes text default null,
  p_idempotency_key text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  item jsonb;
  product_rec record;
  inventory_id uuid;
  current_qty numeric(12, 2);
  line_qty numeric(12, 2);
  line_price numeric(12, 2);
  line_total numeric(12, 2);
  sale_subtotal numeric(12, 2) := 0;
  sale_discount numeric(12, 2) := coalesce(p_discount, 0);
  sale_total numeric(12, 2);
  cash_in numeric(12, 2);
  change_out numeric(12, 2);
  sale_id uuid;
  receipt_no text;
  manila_today date;
  day_count int;
  existing jsonb;
  payment_method text := lower(trim(p_payment_method));
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_member(target_store_id) then
    raise exception 'Not a member of this store';
  end if;

  if cart_items is null or jsonb_typeof(cart_items) <> 'array' or jsonb_array_length(cart_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if payment_method not in ('cash', 'gcash', 'other') then
    raise exception 'Invalid payment method';
  end if;

  if sale_discount < 0 then
    raise exception 'Discount cannot be negative';
  end if;

  if sale_discount > 0 and not public.is_store_manager(target_store_id) then
    raise exception 'Only owners or managers can apply discounts';
  end if;

  if p_customer_id is not null and not exists (
    select 1 from public.customers c
    where c.id = p_customer_id and c.store_id = target_store_id
  ) then
    raise exception 'Customer not found in this store';
  end if;

  -- Idempotent replay
  if p_idempotency_key is not null and length(trim(p_idempotency_key)) > 0 then
    select jsonb_build_object(
      'sale_id', s.id,
      'receipt_number', s.receipt_number,
      'subtotal', s.subtotal,
      'discount', s.discount,
      'total', s.total,
      'payment_method', s.payment_method,
      'cash_received', s.cash_received,
      'change_amount', s.change_amount,
      'replayed', true
    )
    into existing
    from public.sales s
    where s.store_id = target_store_id
      and s.idempotency_key = trim(p_idempotency_key);

    if existing is not null then
      return existing;
    end if;
  end if;

  -- Validate stock + compute subtotal using server prices
  for item in select * from jsonb_array_elements(cart_items)
  loop
    line_qty := nullif(item->>'quantity', '')::numeric;
    if line_qty is null or line_qty <= 0 then
      raise exception 'Invalid cart quantity';
    end if;

    select
      p.id,
      p.name,
      p.selling_price,
      p.is_active,
      p.archived_at
    into product_rec
    from public.products p
    where p.id = (item->>'product_id')::uuid
      and p.store_id = target_store_id
    for update;

    if product_rec.id is null then
      raise exception 'Product not found in cart';
    end if;

    if product_rec.archived_at is not null or product_rec.is_active is not true then
      raise exception 'Product % is not available for sale', product_rec.name;
    end if;

    select i.id, i.quantity
    into inventory_id, current_qty
    from public.inventory i
    where i.store_id = target_store_id
      and i.product_id = product_rec.id
    for update;

    if inventory_id is null then
      raise exception 'No inventory record for %', product_rec.name;
    end if;

    if current_qty < line_qty then
      raise exception 'Insufficient stock for % (available: %)', product_rec.name, current_qty;
    end if;

    line_price := product_rec.selling_price;
    line_total := round(line_price * line_qty, 2);
    sale_subtotal := sale_subtotal + line_total;
  end loop;

  sale_subtotal := round(sale_subtotal, 2);

  if sale_discount > sale_subtotal then
    raise exception 'Discount cannot exceed subtotal';
  end if;

  sale_total := round(sale_subtotal - sale_discount, 2);

  if payment_method = 'cash' then
    cash_in := coalesce(p_cash_received, 0);
    if cash_in < sale_total then
      raise exception 'Cash received is less than total';
    end if;
    change_out := round(cash_in - sale_total, 2);
  else
    cash_in := sale_total;
    change_out := 0;
  end if;

  manila_today := (timezone('Asia/Manila', now()))::date;

  select count(*)::int
  into day_count
  from public.sales s
  where s.store_id = target_store_id
    and (timezone('Asia/Manila', s.created_at))::date = manila_today;

  receipt_no :=
    'RCP-' || to_char(manila_today, 'YYYYMMDD') || '-' ||
    lpad((day_count + 1)::text, 4, '0');

  insert into public.sales (
    store_id,
    receipt_number,
    customer_id,
    cashier_id,
    status,
    subtotal,
    discount,
    total,
    payment_method,
    cash_received,
    change_amount,
    notes,
    idempotency_key
  )
  values (
    target_store_id,
    receipt_no,
    p_customer_id,
    current_user_id,
    'completed',
    sale_subtotal,
    sale_discount,
    sale_total,
    payment_method,
    cash_in,
    change_out,
    nullif(trim(coalesce(p_notes, '')), ''),
    nullif(trim(coalesce(p_idempotency_key, '')), '')
  )
  returning id into sale_id;

  -- Insert items, deduct stock, write movements
  for item in select * from jsonb_array_elements(cart_items)
  loop
    line_qty := (item->>'quantity')::numeric;

    select p.id, p.selling_price, p.name
    into product_rec
    from public.products p
    where p.id = (item->>'product_id')::uuid
      and p.store_id = target_store_id;

    line_price := product_rec.selling_price;
    line_total := round(line_price * line_qty, 2);

    insert into public.sale_items (
      sale_id, product_id, quantity, unit_price, line_total
    ) values (
      sale_id, product_rec.id, line_qty, line_price, line_total
    );

    update public.inventory
    set quantity = quantity - line_qty
    where store_id = target_store_id
      and product_id = product_rec.id
      and quantity >= line_qty;

    if not found then
      raise exception 'Stock changed during checkout for %', product_rec.name;
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
      product_rec.id,
      'sale',
      -line_qty,
      'sale',
      sale_id,
      'POS sale ' || receipt_no,
      current_user_id
    );
  end loop;

  insert into public.payments (
    store_id, sale_id, method, amount
  ) values (
    target_store_id, sale_id, payment_method, sale_total
  );

  return jsonb_build_object(
    'sale_id', sale_id,
    'receipt_number', receipt_no,
    'subtotal', sale_subtotal,
    'discount', sale_discount,
    'total', sale_total,
    'payment_method', payment_method,
    'cash_received', cash_in,
    'change_amount', change_out,
    'replayed', false
  );
end;
$$;

revoke all on function public.pos_checkout(uuid, jsonb, text, numeric, numeric, uuid, text, text) from public;
revoke all on function public.pos_checkout(uuid, jsonb, text, numeric, numeric, uuid, text, text) from anon;
grant execute on function public.pos_checkout(uuid, jsonb, text, numeric, numeric, uuid, text, text) to authenticated;
