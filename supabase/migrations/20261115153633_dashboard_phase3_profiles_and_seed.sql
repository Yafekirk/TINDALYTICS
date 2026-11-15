-- Phase 3: allow store members to see coworker profiles + demo seed RPC

-- ---------------------------------------------------------------------------
-- Profiles: members can view fellow store members (for cashier names, etc.)
-- ---------------------------------------------------------------------------

create policy "Members can view fellow store member profiles"
  on public.profiles for select
  to authenticated
  using (
    exists (
      select 1
      from public.store_members viewer
      join public.store_members peer
        on peer.store_id = viewer.store_id
      where viewer.user_id = auth.uid()
        and peer.user_id = profiles.id
    )
  );

-- ---------------------------------------------------------------------------
-- Demo seed: categories, products, inventory, customers, and sample sales
-- Only for managers/owners of empty stores (no products yet).
-- ---------------------------------------------------------------------------

create or replace function public.seed_demo_store_data(target_store_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  cat_beverages uuid;
  cat_snacks uuid;
  cat_canned uuid;
  cat_personal uuid;
  cat_household uuid;
  cust_ben uuid;
  cust_nena uuid;
  product_ids uuid[];
  product_count int;
  sale_id uuid;
  day_offset int;
  hour_slot int;
  receipt_seq int := 1;
  products_created int := 0;
  sales_created int := 0;
  sale_local timestamp;
  sale_utc timestamptz;
  item_product uuid;
  item_qty numeric(12, 2);
  unit_price numeric(12, 2);
  line_total numeric(12, 2);
  sale_subtotal numeric(12, 2);
  sale_discount numeric(12, 2);
  sale_total numeric(12, 2);
  pay_method text;
  cash_in numeric(12, 2);
  change_out numeric(12, 2);
  item_count int;
  item_idx int;
  cust_id uuid;
  manila_today date;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_manager(target_store_id) then
    raise exception 'Only store owners or managers can seed demo data';
  end if;

  if exists (
    select 1 from public.products p where p.store_id = target_store_id limit 1
  ) then
    raise exception 'Store already has products. Demo seed is only for empty stores.';
  end if;

  insert into public.categories (store_id, name, description) values
    (target_store_id, 'Beverages', 'Drinks and refreshments'),
    (target_store_id, 'Snacks', 'Instant noodles and snacks'),
    (target_store_id, 'Canned Goods', 'Canned and preserved foods'),
    (target_store_id, 'Personal Care', 'Hygiene and personal items'),
    (target_store_id, 'Household', 'Kitchen and household staples');

  select id into cat_beverages from public.categories
    where store_id = target_store_id and name = 'Beverages';
  select id into cat_snacks from public.categories
    where store_id = target_store_id and name = 'Snacks';
  select id into cat_canned from public.categories
    where store_id = target_store_id and name = 'Canned Goods';
  select id into cat_personal from public.categories
    where store_id = target_store_id and name = 'Personal Care';
  select id into cat_household from public.categories
    where store_id = target_store_id and name = 'Household';

  insert into public.products (
    store_id, category_id, name, sku, barcode, description,
    cost_price, selling_price, unit, min_stock_level, is_active
  ) values
    (target_store_id, cat_beverages, 'Coca-Cola 1.5L', 'BEV-COKE-15', '4800012345001', 'Family-size soft drink', 45.00, 65.00, 'bottle', 12, true),
    (target_store_id, cat_snacks, 'Lucky Me Pancit Canton', 'SNK-LM-PC', '4800012345002', 'Classic canton noodles', 12.00, 20.00, 'pack', 24, true),
    (target_store_id, cat_canned, 'Sardines', 'CAN-SRD-155', '4800012345003', '155g canned sardines', 18.00, 30.00, 'can', 15, true),
    (target_store_id, cat_household, 'Rice (per kilo)', 'HSE-RICE-1KG', '4800012345004', 'Local rice sold per kilo', 42.00, 55.00, 'kg', 20, true),
    (target_store_id, cat_beverages, 'Bottled Water 500ml', 'BEV-H2O-500', '4800012345005', 'Purified drinking water', 6.00, 15.00, 'bottle', 30, true),
    (target_store_id, cat_personal, 'Shampoo Sachet', 'PER-SHP-SCH', '4800012345006', 'Single-use shampoo', 5.00, 10.00, 'sachet', 40, true),
    (target_store_id, cat_beverages, 'Coffee Sachet', 'BEV-CFE-SCH', '4800012345007', '3-in-1 coffee mix', 6.50, 12.00, 'sachet', 20, true),
    (target_store_id, cat_snacks, 'Biscuits', 'SNK-BISC', '4800012345008', 'Assorted biscuit pack', 8.00, 15.00, 'pack', 25, true),
    (target_store_id, cat_household, 'Cooking Oil 1L', 'HSE-OIL-1L', '4800012345009', 'Vegetable cooking oil', 78.00, 105.00, 'bottle', 10, true),
    (target_store_id, cat_canned, 'Canned Corned Beef', 'CAN-CBF-150', '4800012345010', '150g corned beef', 42.00, 65.00, 'can', 12, true);

  get diagnostics products_created = row_count;

  insert into public.inventory (store_id, product_id, quantity)
  select
    target_store_id,
    p.id,
    case p.sku
      when 'BEV-COKE-15' then 4
      when 'SNK-LM-PC' then 8
      when 'CAN-SRD-155' then 22
      when 'HSE-RICE-1KG' then 35
      when 'BEV-H2O-500' then 0
      when 'PER-SHP-SCH' then 48
      when 'BEV-CFE-SCH' then 6
      when 'SNK-BISC' then 30
      when 'HSE-OIL-1L' then 3
      when 'CAN-CBF-150' then 18
      else 20
    end
  from public.products p
  where p.store_id = target_store_id;

  insert into public.inventory_movements (
    store_id, product_id, movement_type, quantity, reference_type, notes, created_by
  )
  select
    target_store_id,
    i.product_id,
    'stock_in',
    i.quantity,
    'demo_seed',
    'Initial demo stock',
    current_user_id
  from public.inventory i
  where i.store_id = target_store_id
    and i.quantity > 0;

  insert into public.customers (store_id, name, contact_number, address, notes)
  values
    (target_store_id, 'Mang Ben', '09171234567', 'Near barangay hall', 'Regular customer'),
    (target_store_id, 'Aling Nena', '09189876543', 'Across the street', 'Often buys on credit');

  select id into cust_ben from public.customers
    where store_id = target_store_id and name = 'Mang Ben';
  select id into cust_nena from public.customers
    where store_id = target_store_id and name = 'Aling Nena';

  select array_agg(id order by name), count(*)::int
  into product_ids, product_count
  from public.products
  where store_id = target_store_id;

  manila_today := (timezone('Asia/Manila', now()))::date;

  for day_offset in 0..13 loop
    for hour_slot in 0..5 loop
      if day_offset > 0 and hour_slot = 0 and (day_offset % 3 = 0) then
        continue;
      end if;

      sale_local :=
        (manila_today - day_offset)::timestamp
        + make_interval(hours => 8 + hour_slot * 2, mins => 10 + ((hour_slot * 7) % 40));

      sale_utc := sale_local at time zone 'Asia/Manila';

      pay_method := case when hour_slot % 3 = 0 then 'gcash' else 'cash' end;
      cust_id := case
        when hour_slot = 1 then cust_ben
        when hour_slot = 4 then cust_nena
        else null
      end;

      insert into public.sales (
        store_id, receipt_number, customer_id, cashier_id, status,
        subtotal, discount, total, payment_method, cash_received, change_amount,
        created_at, updated_at
      ) values (
        target_store_id,
        'RCP-DEMO-' || to_char(sale_local, 'YYYYMMDD') || '-' || lpad(receipt_seq::text, 4, '0'),
        cust_id,
        current_user_id,
        'completed',
        0, 0, 0,
        pay_method,
        null, null,
        sale_utc,
        sale_utc
      )
      returning id into sale_id;

      sale_subtotal := 0;
      item_count := 1 + (hour_slot % 3);

      for item_idx in 1..item_count loop
        item_product := product_ids[1 + ((day_offset + hour_slot + item_idx) % product_count)];

        select p.selling_price into unit_price
        from public.products p
        where p.id = item_product;

        item_qty := 1 + ((day_offset + item_idx) % 3);
        line_total := round(unit_price * item_qty, 2);
        sale_subtotal := sale_subtotal + line_total;

        insert into public.sale_items (sale_id, product_id, quantity, unit_price, line_total, created_at)
        values (sale_id, item_product, item_qty, unit_price, line_total, sale_utc);
      end loop;

      sale_discount := case when sale_subtotal > 200 then 5 else 0 end;
      sale_total := sale_subtotal - sale_discount;

      if pay_method = 'cash' then
        cash_in := ceil(sale_total / 50.0) * 50;
        change_out := cash_in - sale_total;
      else
        cash_in := sale_total;
        change_out := 0;
      end if;

      update public.sales
      set
        subtotal = sale_subtotal,
        discount = sale_discount,
        total = sale_total,
        cash_received = cash_in,
        change_amount = change_out
      where id = sale_id;

      insert into public.payments (store_id, sale_id, method, amount, created_at)
      values (target_store_id, sale_id, pay_method, sale_total, sale_utc);

      sales_created := sales_created + 1;
      receipt_seq := receipt_seq + 1;
    end loop;
  end loop;

  insert into public.notifications (store_id, user_id, title, message, type)
  values (
    target_store_id,
    current_user_id,
    'Demo data loaded',
    'Sample products, inventory, and sales were added so you can explore the dashboard.',
    'info'
  );

  return jsonb_build_object(
    'products', products_created,
    'sales', sales_created,
    'store_id', target_store_id
  );
end;
$$;

revoke all on function public.seed_demo_store_data(uuid) from public;
grant execute on function public.seed_demo_store_data(uuid) to authenticated;
