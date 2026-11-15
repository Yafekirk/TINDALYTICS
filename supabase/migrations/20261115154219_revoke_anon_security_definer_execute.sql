-- Harden SECURITY DEFINER execute grants (revoke anon / public where not needed)

revoke all on function public.seed_demo_store_data(uuid) from public;
revoke all on function public.seed_demo_store_data(uuid) from anon;
grant execute on function public.seed_demo_store_data(uuid) to authenticated;

revoke all on function public.create_store_with_owner(text, text, text) from public;
revoke all on function public.create_store_with_owner(text, text, text) from anon;
grant execute on function public.create_store_with_owner(text, text, text) to authenticated;

revoke all on function public.is_store_member(uuid) from public;
revoke all on function public.is_store_member(uuid) from anon;
grant execute on function public.is_store_member(uuid) to authenticated;

revoke all on function public.is_store_manager(uuid) from public;
revoke all on function public.is_store_manager(uuid) from anon;
grant execute on function public.is_store_manager(uuid) to authenticated;

-- Trigger-only helper — should not be callable via the Data API
revoke all on function public.handle_new_user() from public;
revoke all on function public.handle_new_user() from anon;
revoke all on function public.handle_new_user() from authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;
