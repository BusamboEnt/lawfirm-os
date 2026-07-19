-- Law Firm OS — Document storage bucket and access policies

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Objects are stored under <matter_id>/<filename>, so the first path
-- segment scopes storage access to the same per-matter rules as the
-- documents table.

create policy "Read documents for accessible matters"
  on storage.objects for select
  using (
    bucket_id = 'documents'
    and (
      public.has_broad_access()
      or public.is_matter_member((storage.foldername(name))[1]::uuid)
    )
  );

create policy "Upload documents to accessible matters"
  on storage.objects for insert
  with check (
    bucket_id = 'documents'
    and (
      public.has_broad_access()
      or public.is_matter_member((storage.foldername(name))[1]::uuid)
    )
  );

create policy "Delete stored documents with broad access"
  on storage.objects for delete
  using (
    bucket_id = 'documents'
    and public.has_broad_access()
  );
