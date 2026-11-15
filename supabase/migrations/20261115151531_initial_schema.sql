-- Tindalytics Phase 2: core schema, store membership, and RLS

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  email text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Store User'),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Stores & membership
-- ---------------------------------------------------------------------------

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  timezone text not null default 'Asia/Manila',
  currency text not null default 'PHP',
  owner_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger stores_set_updated_at
before update on public.stores
for each row execute function public.set_updated_at();

create table public.store_members (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'cashier')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (store_id, user_id)
);

create index store_members_user_id_idx on public.store_members (user_id);
create index store_members_store_id_idx on public.store_members (store_id);

create trigger store_members_set_updated_at
before update on public.store_members
for each row execute function public.set_updated_at();

create or replace function public.is_store_member(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.store_members sm
    where sm.store_id = target_store_id
      and sm.user_id = auth.uid()
  );
$$;

create or replace function public.is_store_manager(target_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.store_members sm
    where sm.store_id = target_store_id
      and sm.user_id = auth.uid()
      and sm.role in ('owner', 'manager')
  );
$$;

revoke all on function public.is_store_member(uuid) from public;
revoke all on function public.is_store_manager(uuid) from public;
grant execute on function public.is_store_member(uuid) to authenticated;
grant execute on function public.is_store_manager(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Catalog & inventory
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (store_id, name)
);

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index suppliers_store_id_idx on public.suppliers (store_id);

create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  category_id uuid references public.categories (id) on delete set null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  name text not null,
  sku text not null,
  barcode text,
  description text,
  cost_price numeric(12, 2) not null default 0 check (cost_price >= 0),
  selling_price numeric(12, 2) not null default 0 check (selling_price >= 0),
  unit text not null default 'pc',
  min_stock_level numeric(12, 2) not null default 0 check (min_stock_level >= 0),
  image_url text,
  is_active boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (store_id, sku)
);

create index products_store_id_idx on public.products (store_id);
create index products_category_id_idx on public.products (category_id);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (product_id)
);

create index inventory_store_id_idx on public.inventory (store_id);

create trigger inventory_set_updated_at
before update on public.inventory
for each row execute function public.set_updated_at();

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  movement_type text not null check (
    movement_type in ('stock_in', 'stock_out', 'sale', 'adjustment', 'purchase_receive', 'refund')
  ),
  quantity numeric(12, 2) not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index inventory_movements_store_id_idx on public.inventory_movements (store_id);
create index inventory_movements_product_id_idx on public.inventory_movements (product_id);

-- ---------------------------------------------------------------------------
-- Purchasing
-- ---------------------------------------------------------------------------

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  status text not null default 'draft' check (
    status in ('draft', 'ordered', 'partially_received', 'received', 'cancelled')
  ),
  order_date date not null default (timezone('Asia/Manila', now()))::date,
  expected_date date,
  notes text,
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index purchase_orders_store_id_idx on public.purchase_orders (store_id);

create trigger purchase_orders_set_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  received_quantity numeric(12, 2) not null default 0 check (received_quantity >= 0),
  unit_cost numeric(12, 2) not null default 0 check (unit_cost >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index purchase_order_items_po_id_idx on public.purchase_order_items (purchase_order_id);

-- ---------------------------------------------------------------------------
-- Customers, sales, payments, credits
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  contact_number text,
  address text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index customers_store_id_idx on public.customers (store_id);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  receipt_number text not null,
  customer_id uuid references public.customers (id) on delete set null,
  cashier_id uuid references public.profiles (id) on delete set null,
  status text not null default 'completed' check (
    status in ('completed', 'voided', 'refunded')
  ),
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null default 0 check (total >= 0),
  payment_method text not null default 'cash',
  cash_received numeric(12, 2),
  change_amount numeric(12, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (store_id, receipt_number)
);

create index sales_store_id_idx on public.sales (store_id);
create index sales_created_at_idx on public.sales (created_at desc);

create trigger sales_set_updated_at
before update on public.sales
for each row execute function public.set_updated_at();

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity numeric(12, 2) not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  line_total numeric(12, 2) not null check (line_total >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index sale_items_sale_id_idx on public.sale_items (sale_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  sale_id uuid not null references public.sales (id) on delete cascade,
  method text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  reference text,
  created_at timestamptz not null default timezone('utc', now())
);

create index payments_store_id_idx on public.payments (store_id);
create index payments_sale_id_idx on public.payments (sale_id);

create table public.customer_credits (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  sale_id uuid references public.sales (id) on delete set null,
  amount numeric(12, 2) not null check (amount > 0),
  balance numeric(12, 2) not null check (balance >= 0),
  due_date date,
  status text not null default 'open' check (status in ('open', 'partial', 'paid', 'voided')),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index customer_credits_store_id_idx on public.customer_credits (store_id);
create index customer_credits_customer_id_idx on public.customer_credits (customer_id);

create trigger customer_credits_set_updated_at
before update on public.customer_credits
for each row execute function public.set_updated_at();

create table public.credit_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  credit_id uuid not null references public.customer_credits (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null default 'cash',
  paid_at timestamptz not null default timezone('utc', now()),
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index credit_payments_credit_id_idx on public.credit_payments (credit_id);

-- ---------------------------------------------------------------------------
-- Expenses & notifications
-- ---------------------------------------------------------------------------

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  name text not null,
  category text not null check (
    category in ('electricity', 'water', 'rent', 'transportation', 'supplies', 'miscellaneous')
  ),
  amount numeric(12, 2) not null check (amount >= 0),
  expense_date date not null default (timezone('Asia/Manila', now()))::date,
  description text,
  payment_method text not null default 'cash',
  status text not null default 'active' check (status in ('active', 'voided', 'archived')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index expenses_store_id_idx on public.expenses (store_id);

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  title text not null,
  message text not null,
  type text not null default 'info',
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create index notifications_store_user_idx on public.notifications (store_id, user_id);

-- ---------------------------------------------------------------------------
-- Bootstrap RPC: create store + owner membership for a new account
-- ---------------------------------------------------------------------------

create or replace function public.create_store_with_owner(
  store_name text,
  store_address text default null,
  store_phone text default null
)
returns public.stores
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_store public.stores;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if nullif(trim(store_name), '') is null then
    raise exception 'Store name is required';
  end if;

  insert into public.stores (name, address, phone, owner_id)
  values (trim(store_name), store_address, store_phone, current_user_id)
  returning * into new_store;

  insert into public.store_members (store_id, user_id, role)
  values (new_store.id, current_user_id, 'owner');

  return new_store;
end;
$$;

revoke all on function public.create_store_with_owner(text, text, text) from public;
grant execute on function public.create_store_with_owner(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.customer_credits enable row level security;
alter table public.credit_payments enable row level security;
alter table public.expenses enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Stores
create policy "Members can view their stores"
  on public.stores for select
  to authenticated
  using (public.is_store_member(id));

create policy "Owners can update their stores"
  on public.stores for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "Authenticated users can create stores"
  on public.stores for insert
  to authenticated
  with check (owner_id = auth.uid());

-- Store members
create policy "Members can view store membership"
  on public.store_members for select
  to authenticated
  using (public.is_store_member(store_id) or user_id = auth.uid());

create policy "Managers can insert members"
  on public.store_members for insert
  to authenticated
  with check (public.is_store_manager(store_id));

create policy "Managers can update members"
  on public.store_members for update
  to authenticated
  using (public.is_store_manager(store_id))
  with check (public.is_store_manager(store_id));

create policy "Managers can delete members"
  on public.store_members for delete
  to authenticated
  using (public.is_store_manager(store_id));

-- Generic store-scoped policies
create policy "Members can select categories"
  on public.categories for select to authenticated
  using (public.is_store_member(store_id));
create policy "Managers can insert categories"
  on public.categories for insert to authenticated
  with check (public.is_store_manager(store_id));
create policy "Managers can update categories"
  on public.categories for update to authenticated
  using (public.is_store_manager(store_id))
  with check (public.is_store_manager(store_id));
create policy "Managers can delete categories"
  on public.categories for delete to authenticated
  using (public.is_store_manager(store_id));

create policy "Members can select suppliers"
  on public.suppliers for select to authenticated
  using (public.is_store_member(store_id));
create policy "Managers can insert suppliers"
  on public.suppliers for insert to authenticated
  with check (public.is_store_manager(store_id));
create policy "Managers can update suppliers"
  on public.suppliers for update to authenticated
  using (public.is_store_manager(store_id))
  with check (public.is_store_manager(store_id));
create policy "Managers can delete suppliers"
  on public.suppliers for delete to authenticated
  using (public.is_store_manager(store_id));

create policy "Members can select products"
  on public.products for select to authenticated
  using (public.is_store_member(store_id));
create policy "Managers can insert products"
  on public.products for insert to authenticated
  with check (public.is_store_manager(store_id));
create policy "Managers can update products"
  on public.products for update to authenticated
  using (public.is_store_manager(store_id))
  with check (public.is_store_manager(store_id));
create policy "Managers can delete products"
  on public.products for delete to authenticated
  using (public.is_store_manager(store_id));

create policy "Members can select inventory"
  on public.inventory for select to authenticated
  using (public.is_store_member(store_id));
create policy "Managers can insert inventory"
  on public.inventory for insert to authenticated
  with check (public.is_store_manager(store_id));
create policy "Managers can update inventory"
  on public.inventory for update to authenticated
  using (public.is_store_manager(store_id))
  with check (public.is_store_manager(store_id));

create policy "Members can select inventory movements"
  on public.inventory_movements for select to authenticated
  using (public.is_store_member(store_id));
create policy "Members can insert inventory movements"
  on public.inventory_movements for insert to authenticated
  with check (public.is_store_member(store_id));

create policy "Members can select purchase orders"
  on public.purchase_orders for select to authenticated
  using (public.is_store_member(store_id));
create policy "Managers can insert purchase orders"
  on public.purchase_orders for insert to authenticated
  with check (public.is_store_manager(store_id));
create policy "Managers can update purchase orders"
  on public.purchase_orders for update to authenticated
  using (public.is_store_manager(store_id))
  with check (public.is_store_manager(store_id));

create policy "Members can select purchase order items"
  on public.purchase_order_items for select to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and public.is_store_member(po.store_id)
    )
  );
create policy "Managers can insert purchase order items"
  on public.purchase_order_items for insert to authenticated
  with check (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and public.is_store_manager(po.store_id)
    )
  );
create policy "Managers can update purchase order items"
  on public.purchase_order_items for update to authenticated
  using (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and public.is_store_manager(po.store_id)
    )
  )
  with check (
    exists (
      select 1 from public.purchase_orders po
      where po.id = purchase_order_id
        and public.is_store_manager(po.store_id)
    )
  );

create policy "Members can select customers"
  on public.customers for select to authenticated
  using (public.is_store_member(store_id));
create policy "Members can insert customers"
  on public.customers for insert to authenticated
  with check (public.is_store_member(store_id));
create policy "Members can update customers"
  on public.customers for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy "Members can select sales"
  on public.sales for select to authenticated
  using (public.is_store_member(store_id));
create policy "Members can insert sales"
  on public.sales for insert to authenticated
  with check (public.is_store_member(store_id));
create policy "Members can update sales"
  on public.sales for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy "Members can select sale items"
  on public.sale_items for select to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id and public.is_store_member(s.store_id)
    )
  );
create policy "Members can insert sale items"
  on public.sale_items for insert to authenticated
  with check (
    exists (
      select 1 from public.sales s
      where s.id = sale_id and public.is_store_member(s.store_id)
    )
  );

create policy "Members can select payments"
  on public.payments for select to authenticated
  using (public.is_store_member(store_id));
create policy "Members can insert payments"
  on public.payments for insert to authenticated
  with check (public.is_store_member(store_id));

create policy "Members can select customer credits"
  on public.customer_credits for select to authenticated
  using (public.is_store_member(store_id));
create policy "Members can insert customer credits"
  on public.customer_credits for insert to authenticated
  with check (public.is_store_member(store_id));
create policy "Members can update customer credits"
  on public.customer_credits for update to authenticated
  using (public.is_store_member(store_id))
  with check (public.is_store_member(store_id));

create policy "Members can select credit payments"
  on public.credit_payments for select to authenticated
  using (public.is_store_member(store_id));
create policy "Members can insert credit payments"
  on public.credit_payments for insert to authenticated
  with check (public.is_store_member(store_id));

create policy "Members can select expenses"
  on public.expenses for select to authenticated
  using (public.is_store_member(store_id));
create policy "Managers can insert expenses"
  on public.expenses for insert to authenticated
  with check (public.is_store_manager(store_id));
create policy "Managers can update expenses"
  on public.expenses for update to authenticated
  using (public.is_store_manager(store_id))
  with check (public.is_store_manager(store_id));

create policy "Members can select notifications"
  on public.notifications for select to authenticated
  using (
    public.is_store_member(store_id)
    and (user_id is null or user_id = auth.uid())
  );
create policy "Members can update notifications"
  on public.notifications for update to authenticated
  using (
    public.is_store_member(store_id)
    and (user_id is null or user_id = auth.uid())
  )
  with check (
    public.is_store_member(store_id)
    and (user_id is null or user_id = auth.uid())
  );
create policy "Managers can insert notifications"
  on public.notifications for insert to authenticated
  with check (public.is_store_manager(store_id));
