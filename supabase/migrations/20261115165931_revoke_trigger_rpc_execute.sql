-- Phase 13: revoke public API execute on trigger-only SECURITY DEFINER helpers.
-- Business RPCs remain executable by authenticated users and enforce store membership internally.

revoke all on function public.log_sale_created_audit() from public;
revoke all on function public.log_sale_created_audit() from anon;
revoke all on function public.log_sale_created_audit() from authenticated;

-- Keep seed demo available only to store managers via wrapper checks already in the function,
-- but prevent anonymous access (already revoked) and document intentional authenticated access.
-- No change to seed_demo_store_data / business RPCs: they intentionally use SECURITY DEFINER
-- with is_store_member / is_store_manager authorization inside the function body.
