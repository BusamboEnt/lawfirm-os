-- Law Firm OS — Row Level Security Policies
-- Per-matter access scoping: users only see data for matters they are assigned to.
-- Partners and admins have broader access.

-- ============================================================
-- Enable RLS on all tables
-- ============================================================
alter table public.profiles       enable row level security;
alter table public.clients        enable row level security;
alter table public.matters        enable row level security;
alter table public.matter_clients enable row level security;
alter table public.matter_members enable row level security;
alter table public.documents      enable row level security;
alter table public.tasks          enable row level security;
alter table public.time_entries   enable row level security;
alter table public.invoices       enable row level security;
alter table public.trust_ledger   enable row level security;
alter table public.trust_audit_log enable row level security;

-- ============================================================
-- Helper functions
-- ============================================================

-- Get the current user's role
create or replace function public.current_user_role()
returns public.user_role
language sql stable security definer
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Check if user is assigned to a matter
create or replace function public.is_matter_member(p_matter_id uuid)
returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.matter_members
    where matter_id = p_matter_id and user_id = auth.uid()
  )
$$;

-- Check if user is partner or admin (broad access)
create or replace function public.has_broad_access()
returns boolean
language sql stable security definer
as $$
  select public.current_user_role() in ('partner', 'admin')
$$;

-- ============================================================
-- PROFILES
-- ============================================================
create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "Admins can manage profiles"
  on public.profiles for all
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- MATTERS
-- ============================================================
create policy "Members and broad-access can view matters"
  on public.matters for select
  to authenticated
  using (
    public.has_broad_access()
    or public.is_matter_member(id)
  );

create policy "Partners and admins can create matters"
  on public.matters for insert
  to authenticated
  with check (public.has_broad_access());

create policy "Partners and admins can update matters"
  on public.matters for update
  to authenticated
  using (public.has_broad_access())
  with check (public.has_broad_access());

create policy "Partners and admins can delete matters"
  on public.matters for delete
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- MATTER MEMBERS
-- ============================================================
create policy "Members can view matter assignments"
  on public.matter_members for select
  to authenticated
  using (
    public.has_broad_access()
    or user_id = auth.uid()
    or public.is_matter_member(matter_id)
  );

create policy "Partners and admins manage matter members"
  on public.matter_members for all
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- CLIENTS
-- ============================================================
create policy "View clients linked to accessible matters"
  on public.clients for select
  to authenticated
  using (
    public.has_broad_access()
    or exists (
      select 1 from public.matter_clients mc
      join public.matter_members mm on mm.matter_id = mc.matter_id
      where mc.client_id = clients.id and mm.user_id = auth.uid()
    )
  );

create policy "Partners and admins can create clients"
  on public.clients for insert
  to authenticated
  with check (public.has_broad_access());

create policy "Partners and admins can update clients"
  on public.clients for update
  to authenticated
  using (public.has_broad_access())
  with check (public.has_broad_access());

create policy "Partners and admins can delete clients"
  on public.clients for delete
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- MATTER CLIENTS
-- ============================================================
create policy "View matter-client links for accessible matters"
  on public.matter_clients for select
  to authenticated
  using (
    public.has_broad_access()
    or public.is_matter_member(matter_id)
  );

create policy "Partners and admins manage matter-client links"
  on public.matter_clients for all
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- DOCUMENTS
-- ============================================================
create policy "View documents for accessible matters"
  on public.documents for select
  to authenticated
  using (
    public.has_broad_access()
    or public.is_matter_member(matter_id)
  );

create policy "Upload documents to accessible matters"
  on public.documents for insert
  to authenticated
  with check (
    public.has_broad_access()
    or public.is_matter_member(matter_id)
  );

create policy "Update own documents or broad access"
  on public.documents for update
  to authenticated
  using (
    public.has_broad_access()
    or (uploaded_by = auth.uid() and public.is_matter_member(matter_id))
  );

create policy "Delete documents with broad access"
  on public.documents for delete
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- TASKS
-- ============================================================
create policy "View tasks for accessible matters or assigned"
  on public.tasks for select
  to authenticated
  using (
    public.has_broad_access()
    or assigned_to = auth.uid()
    or (matter_id is not null and public.is_matter_member(matter_id))
  );

create policy "Create tasks for accessible matters"
  on public.tasks for insert
  to authenticated
  with check (
    public.has_broad_access()
    or (matter_id is not null and public.is_matter_member(matter_id))
  );

create policy "Update tasks if assigned or broad access"
  on public.tasks for update
  to authenticated
  using (
    public.has_broad_access()
    or assigned_to = auth.uid()
    or created_by = auth.uid()
  );

create policy "Delete tasks with broad access"
  on public.tasks for delete
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- TIME ENTRIES
-- ============================================================
create policy "View own time entries or broad access"
  on public.time_entries for select
  to authenticated
  using (
    public.has_broad_access()
    or user_id = auth.uid()
  );

create policy "Create own time entries"
  on public.time_entries for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Update own draft time entries"
  on public.time_entries for update
  to authenticated
  using (
    public.has_broad_access()
    or (user_id = auth.uid() and status = 'draft')
  );

create policy "Delete own draft time entries"
  on public.time_entries for delete
  to authenticated
  using (
    user_id = auth.uid() and status = 'draft'
  );

-- ============================================================
-- INVOICES
-- ============================================================
create policy "View invoices for accessible matters"
  on public.invoices for select
  to authenticated
  using (
    public.has_broad_access()
    or public.is_matter_member(matter_id)
  );

create policy "Partners and admins manage invoices"
  on public.invoices for all
  to authenticated
  using (public.has_broad_access());

-- ============================================================
-- TRUST LEDGER  (append-only: no update/delete for anyone)
-- ============================================================
create policy "View trust entries for accessible matters"
  on public.trust_ledger for select
  to authenticated
  using (
    public.has_broad_access()
    or public.is_matter_member(matter_id)
  );

create policy "Partners can create trust entries"
  on public.trust_ledger for insert
  to authenticated
  with check (
    public.current_user_role() = 'partner'
    or public.current_user_role() = 'admin'
  );

-- No UPDATE or DELETE policies — trust ledger is append-only.

-- ============================================================
-- TRUST AUDIT LOG  (append-only: no update/delete)
-- ============================================================
create policy "View audit log for accessible trust entries"
  on public.trust_audit_log for select
  to authenticated
  using (
    public.has_broad_access()
    or exists (
      select 1 from public.trust_ledger tl
      join public.matter_members mm on mm.matter_id = tl.matter_id
      where tl.id = trust_audit_log.ledger_id and mm.user_id = auth.uid()
    )
  );

create policy "System can insert audit log entries"
  on public.trust_audit_log for insert
  to authenticated
  with check (
    public.current_user_role() in ('partner', 'admin')
  );

-- No UPDATE or DELETE policies — audit log is append-only.
