-- Law Firm OS — Document access audit log
-- Records who viewed, downloaded, or uploaded each document. Append-only:
-- like the trust ledger, rows can never be updated or deleted.

create table public.document_access_log (
  id           uuid primary key default extensions.uuid_generate_v4(),
  document_id  uuid references public.documents(id) on delete set null,
  matter_id    uuid references public.matters(id) on delete set null,
  file_name    text not null,
  action       text not null check (action in ('view', 'download', 'upload')),
  accessed_by  uuid not null references public.profiles(id),
  created_at   timestamptz not null default now()
);

create index idx_doc_access_log_document on public.document_access_log(document_id);
create index idx_doc_access_log_user on public.document_access_log(accessed_by);
create index idx_doc_access_log_created on public.document_access_log(created_at);

alter table public.document_access_log enable row level security;

-- Anyone signed in may record their own access; nobody may write rows
-- on behalf of someone else.
create policy "Log own document access"
  on public.document_access_log for insert
  with check (accessed_by = auth.uid());

-- Users see their own history; partners/admins see everything.
create policy "View document access log"
  on public.document_access_log for select
  using (accessed_by = auth.uid() or public.has_broad_access());

-- No update/delete policies, and immutability enforced by trigger so even
-- the service role cannot rewrite history.
create or replace function public.prevent_access_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'document_access_log is append-only; % is not allowed', tg_op;
end;
$$;

create trigger doc_access_log_no_update
  before update on public.document_access_log
  for each row execute function public.prevent_access_log_mutation();

create trigger doc_access_log_no_delete
  before delete on public.document_access_log
  for each row execute function public.prevent_access_log_mutation();
