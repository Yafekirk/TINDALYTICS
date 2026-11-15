-- Phase 4: product image storage bucket + RLS

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {store_id}/{product_id}/{filename}

create policy "Store members can view product images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_store_member(((storage.foldername(name))[1])::uuid)
  );

create policy "Public can view product images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'product-images');

create policy "Managers can upload product images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_store_manager(((storage.foldername(name))[1])::uuid)
  );

create policy "Managers can update product images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_store_manager(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'product-images'
    and public.is_store_manager(((storage.foldername(name))[1])::uuid)
  );

create policy "Managers can delete product images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_store_manager(((storage.foldername(name))[1])::uuid)
  );
