-- Supabase Storage Setup for Reference Images
-- Run this SQL script in your Supabase SQL editor

-- Create storage bucket for reference images
-- Note: You may need to create the bucket manually in the Supabase dashboard first,
-- then run the policies below

-- Storage policies for reference-images bucket
-- These policies allow users to manage their own images

-- Allow users to upload their own images
create policy "Users can upload own images"
  on storage.objects for insert
  with check (
    bucket_id = 'reference-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to view their own images
create policy "Users can view own images"
  on storage.objects for select
  using (
    bucket_id = 'reference-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete their own images
create policy "Users can delete own images"
  on storage.objects for delete
  using (
    bucket_id = 'reference-images' and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- If you want public access (no authentication required), use this instead:
-- create policy "Public read access"
--   on storage.objects for select
--   using (bucket_id = 'reference-images');
