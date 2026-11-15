-- Phase 11: atomic customer credit (utang) payments and voiding

create index if not exists customer_credits_status_idx
  on public.customer_credits (store_id, status);

create index if not exists customer_credits_due_date_idx
  on public.customer_credits (store_id, due_date);

create or replace function public.record_credit_payment(
  target_store_id uuid,
  target_credit_id uuid,
  p_amount numeric,
  p_payment_method text,
  p_notes text default null,
  p_paid_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  credit_rec public.customer_credits%rowtype;
  pay_amount numeric(12, 2);
  pay_method text := lower(trim(coalesce(p_payment_method, 'cash')));
  paid_at timestamptz := coalesce(p_paid_at, timezone('utc', now()));
  notes_text text := nullif(trim(coalesce(p_notes, '')), '');
  payment_id uuid;
  next_balance numeric(12, 2);
  next_status text;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_member(target_store_id) then
    raise exception 'Not a member of this store';
  end if;

  if pay_method not in ('cash', 'gcash', 'other') then
    raise exception 'Invalid payment method';
  end if;

  pay_amount := round(coalesce(p_amount, 0)::numeric, 2);
  if pay_amount <= 0 then
    raise exception 'Payment amount must be greater than zero';
  end if;

  select *
  into credit_rec
  from public.customer_credits
  where id = target_credit_id
    and store_id = target_store_id
  for update;

  if credit_rec.id is null then
    raise exception 'Credit record not found';
  end if;

  if credit_rec.status not in ('open', 'partial') then
    raise exception 'Only open or partial credits can accept payments';
  end if;

  if pay_amount > credit_rec.balance then
    raise exception 'Payment exceeds outstanding balance';
  end if;

  next_balance := round(credit_rec.balance - pay_amount, 2);
  if next_balance < 0 then
    raise exception 'Payment exceeds outstanding balance';
  end if;

  next_status := case
    when next_balance = 0 then 'paid'
    else 'partial'
  end;

  insert into public.credit_payments (
    store_id,
    credit_id,
    amount,
    payment_method,
    paid_at,
    notes,
    created_by
  )
  values (
    target_store_id,
    credit_rec.id,
    pay_amount,
    pay_method,
    paid_at,
    notes_text,
    current_user_id
  )
  returning id into payment_id;

  update public.customer_credits
  set
    balance = next_balance,
    status = next_status
  where id = credit_rec.id;

  return jsonb_build_object(
    'payment_id', payment_id,
    'credit_id', credit_rec.id,
    'amount', pay_amount,
    'balance', next_balance,
    'status', next_status,
    'payment_method', pay_method
  );
end;
$$;

revoke all on function public.record_credit_payment(uuid, uuid, numeric, text, text, timestamptz) from public;
revoke all on function public.record_credit_payment(uuid, uuid, numeric, text, text, timestamptz) from anon;
grant execute on function public.record_credit_payment(uuid, uuid, numeric, text, text, timestamptz) to authenticated;

create or replace function public.void_customer_credit(
  target_store_id uuid,
  target_credit_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  credit_rec public.customer_credits%rowtype;
  reason_text text := nullif(trim(coalesce(p_reason, '')), '');
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_store_manager(target_store_id) then
    raise exception 'Only store owners or managers can void credits';
  end if;

  select *
  into credit_rec
  from public.customer_credits
  where id = target_credit_id
    and store_id = target_store_id
  for update;

  if credit_rec.id is null then
    raise exception 'Credit record not found';
  end if;

  if credit_rec.status not in ('open', 'partial') then
    raise exception 'Only open or partial credits can be voided';
  end if;

  update public.customer_credits
  set
    status = 'voided',
    balance = 0,
    notes = case
      when reason_text is null then
        case
          when notes is null or length(trim(notes)) = 0 then 'Voided'
          else notes || E'\nVoided'
        end
      when notes is null or length(trim(notes)) = 0 then 'Voided: ' || reason_text
      else notes || E'\nVoided: ' || reason_text
    end
  where id = credit_rec.id;

  return jsonb_build_object(
    'credit_id', credit_rec.id,
    'status', 'voided',
    'previous_balance', credit_rec.balance
  );
end;
$$;

revoke all on function public.void_customer_credit(uuid, uuid, text) from public;
revoke all on function public.void_customer_credit(uuid, uuid, text) from anon;
grant execute on function public.void_customer_credit(uuid, uuid, text) to authenticated;
