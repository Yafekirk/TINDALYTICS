-- Phase 7: sales audit trail + atomic void/refund with inventory restore

alter table public.sales
  add column if not exists status_reason text,
  add column if not exists status_changed_at timestamptz,
  add column if not exists status_changed_by uuid references public.profiles (id) on delete set null;

create index if not exists sales_store_status_idx
  on public.sales (store_id, status);

create index if not exists sales_store_payment_method_idx
  on public.sales (store_id, payment_method);

create index if not exists sales_store_cashier_id_idx
  on public.sales (store_id, cashier_id);

create table if not exists public.sale_audit_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  sale_id uuid not null references public.sales (id) on delete cascade,
  action text not null check (
    action in ('created', 'voided', 'refunded', 'receipt_reprinted')
  ),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sale_audit_events_sale_id_idx
  on public.sale_audit_events (sale_id, created_at desc);

create index if not exists sale_audit_events_store_id_idx
  on public.sale_audit_events (store_id, created_at desc);

alter table public.sale_audit_events enable row level security;

drop policy if exists "Members can select sale audit events" on public.sale_audit_events;
create policy "Members can select sale audit events"
  on public.sale_audit_events for select to authenticated
  using (public.is_store_member(store_id));

drop policy if exists "Members can insert sale audit events" on public.sale_audit_events;
create policy "Members can insert sale audit events"
  on public.sale_audit_events for insert to authenticated
  with check (public.is_store_member(store_id));

-- Audit sale creation via trigger (covers POS checkout and seed inserts)
create or replace function public.log_sale_created_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.sale_audit_events (
    store_id, sale_id, action, reason, metadata, created_by
  ) values (
    NEW.store_id,
    NEW.id,
    'created',
    null,
    jsonb_build_object(
      'receipt_number', NEW.receipt_number,
      'total', NEW.total,
      'payment_method', NEW.payment_method
    ),
    NEW.cashier_id
  );
  return NEW;
end;
$$;

drop trigger if exists sales_log_created_audit on public.sales;
create trigger sales_log_created_audit
after insert on public.sales
for each row
execute function public.log_sale_created_audit();

revoke all on function public.log_sale_created_audit() from public;
revoke all on function public.log_sale_created_audit() from anon;

create or replace function public.void_or_refund_sale(
  target_store_id uuid,
  target_sale_id uuid,
  p_action text,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  sale_rec record;
  item_rec record;
  action_text text := lower(trim(p_action));
  next_status text;
  reason_text text := nullif(trim(coalesce(p_reason, '')), '');
  restored_lines int := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_manager(target_store_id) then
    raise exception 'Only owners or managers can void or refund sales';
  end if;

  if action_text not in ('void', 'refund') then
    raise exception 'Action must be void or refund';
  end if;

  if reason_text is null then
    raise exception 'A reason is required';
  end if;

  if length(reason_text) < 3 then
    raise exception 'Reason must be at least 3 characters';
  end if;

  next_status := case when action_text = 'void' then 'voided' else 'refunded' end;

  select
    s.id,
    s.store_id,
    s.receipt_number,
    s.status,
    s.total,
    s.payment_method
  into sale_rec
  from public.sales s
  where s.id = target_sale_id
    and s.store_id = target_store_id
  for update;

  if sale_rec.id is null then
    raise exception 'Sale not found';
  end if;

  if sale_rec.status <> 'completed' then
    raise exception 'Only completed sales can be %ed', action_text;
  end if;

  for item_rec in
    select si.product_id, si.quantity, p.name as product_name
    from public.sale_items si
    join public.products p on p.id = si.product_id
    where si.sale_id = sale_rec.id
  loop
    update public.inventory
    set quantity = quantity + item_rec.quantity
    where store_id = target_store_id
      and product_id = item_rec.product_id;

    if not found then
      insert into public.inventory (store_id, product_id, quantity)
      values (target_store_id, item_rec.product_id, item_rec.quantity);
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
      'refund',
      item_rec.quantity,
      'sale',
      sale_rec.id,
      initcap(action_text) || ' ' || sale_rec.receipt_number || ' - ' || item_rec.product_name,
      current_user_id
    );

    restored_lines := restored_lines + 1;
  end loop;

  update public.sales
  set
    status = next_status,
    status_reason = reason_text,
    status_changed_at = timezone('utc', now()),
    status_changed_by = current_user_id,
    notes = case
      when notes is null or length(trim(notes)) = 0 then initcap(action_text) || ': ' || reason_text
      else notes || E'\n' || initcap(action_text) || ': ' || reason_text
    end
  where id = sale_rec.id;

  -- Soft-close any open credit tied to this sale
  update public.customer_credits
  set
    status = 'voided',
    balance = 0,
    notes = case
      when notes is null or length(trim(notes)) = 0 then 'Closed due to sale ' || action_text
      else notes || E'\nClosed due to sale ' || action_text
    end
  where store_id = target_store_id
    and sale_id = sale_rec.id
    and status in ('open', 'partial');

  insert into public.sale_audit_events (
    store_id, sale_id, action, reason, metadata, created_by
  ) values (
    target_store_id,
    sale_rec.id,
    next_status,
    reason_text,
    jsonb_build_object(
      'receipt_number', sale_rec.receipt_number,
      'total', sale_rec.total,
      'payment_method', sale_rec.payment_method,
      'restored_lines', restored_lines
    ),
    current_user_id
  );

  return jsonb_build_object(
    'sale_id', sale_rec.id,
    'receipt_number', sale_rec.receipt_number,
    'status', next_status,
    'restored_lines', restored_lines,
    'total', sale_rec.total
  );
end;
$$;

revoke all on function public.void_or_refund_sale(uuid, uuid, text, text) from public;
revoke all on function public.void_or_refund_sale(uuid, uuid, text, text) from anon;
grant execute on function public.void_or_refund_sale(uuid, uuid, text, text) to authenticated;

create or replace function public.log_sale_receipt_reprint(
  target_store_id uuid,
  target_sale_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  sale_rec record;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_member(target_store_id) then
    raise exception 'Not a member of this store';
  end if;

  select s.id, s.receipt_number, s.status
  into sale_rec
  from public.sales s
  where s.id = target_sale_id
    and s.store_id = target_store_id;

  if sale_rec.id is null then
    raise exception 'Sale not found';
  end if;

  insert into public.sale_audit_events (
    store_id, sale_id, action, reason, metadata, created_by
  ) values (
    target_store_id,
    sale_rec.id,
    'receipt_reprinted',
    null,
    jsonb_build_object(
      'receipt_number', sale_rec.receipt_number,
      'status', sale_rec.status
    ),
    current_user_id
  );

  return jsonb_build_object(
    'sale_id', sale_rec.id,
    'receipt_number', sale_rec.receipt_number,
    'logged', true
  );
end;
$$;

revoke all on function public.log_sale_receipt_reprint(uuid, uuid) from public;
revoke all on function public.log_sale_receipt_reprint(uuid, uuid) from anon;
grant execute on function public.log_sale_receipt_reprint(uuid, uuid) to authenticated;
