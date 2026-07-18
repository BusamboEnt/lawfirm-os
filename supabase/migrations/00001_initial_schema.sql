-- Law Firm OS — Initial Schema
-- Covers: users/roles, matters, clients, documents, calendar/tasks,
--         time entries, invoices, and trust/IOLTA ledger.

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "uuid-ossp" with schema extensions;
create extension if not exists "moddatetime" with schema extensions;

-- ============================================================
-- ENUMS
-- ============================================================
create type public.user_role as enum ('partner', 'associate', 'paralegal', 'admin');
create type public.matter_status as enum ('open', 'closed', 'pending');
create type public.task_status as enum ('pending', 'in_progress', 'completed', 'cancelled');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');
create type public.time_entry_status as enum ('draft', 'submitted', 'approved', 'billed');
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue', 'void');
create type public.trust_txn_type as enum ('deposit', 'withdrawal', 'transfer_to_operating', 'interest', 'refund');
create type public.ledger_account as enum ('trust', 'operating');

-- ============================================================
-- 1. PROFILES  (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text not null,
  role        public.user_role not null default 'associate',
  bar_number  text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- 2. CLIENTS
-- ============================================================
create table public.clients (
  id              uuid primary key default extensions.uuid_generate_v4(),
  name            text not null,
  email           text,
  phone           text,
  address         text,
  company         text,
  notes           text,
  conflict_check  jsonb default '[]'::jsonb,
  intake_data     jsonb default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger clients_updated_at
  before update on public.clients
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- 3. MATTERS
-- ============================================================
create table public.matters (
  id              uuid primary key default extensions.uuid_generate_v4(),
  matter_number   text not null unique,
  title           text not null,
  status          public.matter_status not null default 'open',
  practice_area   text,
  description     text,
  date_opened     date not null default current_date,
  date_closed     date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger matters_updated_at
  before update on public.matters
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- 4. MATTER–CLIENT  (many-to-many)
-- ============================================================
create table public.matter_clients (
  matter_id  uuid not null references public.matters(id) on delete cascade,
  client_id  uuid not null references public.clients(id) on delete cascade,
  role       text default 'client',
  primary key (matter_id, client_id)
);

-- ============================================================
-- 5. MATTER–MEMBER  (per-matter access scoping)
-- ============================================================
create table public.matter_members (
  matter_id  uuid not null references public.matters(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       text not null default 'assigned',
  created_at timestamptz not null default now(),
  primary key (matter_id, user_id)
);

-- ============================================================
-- 6. DOCUMENTS
-- ============================================================
create table public.documents (
  id           uuid primary key default extensions.uuid_generate_v4(),
  matter_id    uuid not null references public.matters(id) on delete cascade,
  uploaded_by  uuid not null references public.profiles(id),
  file_name    text not null,
  file_path    text not null,
  file_size    bigint,
  mime_type    text,
  version      integer not null default 1,
  parent_id    uuid references public.documents(id),
  description  text,
  created_at   timestamptz not null default now()
);

create index idx_documents_matter on public.documents(matter_id);

-- ============================================================
-- 7. CALENDAR / TASKS
-- ============================================================
create table public.tasks (
  id           uuid primary key default extensions.uuid_generate_v4(),
  matter_id    uuid references public.matters(id) on delete cascade,
  assigned_to  uuid references public.profiles(id),
  created_by   uuid not null references public.profiles(id),
  title        text not null,
  description  text,
  status       public.task_status not null default 'pending',
  priority     public.task_priority not null default 'medium',
  due_date     timestamptz,
  is_court_date     boolean not null default false,
  is_sol_deadline   boolean not null default false,
  reminder_at       timestamptz,
  completed_at      timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function extensions.moddatetime(updated_at);

create index idx_tasks_matter on public.tasks(matter_id);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_tasks_due on public.tasks(due_date);

-- ============================================================
-- 8. TIME ENTRIES
-- ============================================================
create table public.time_entries (
  id           uuid primary key default extensions.uuid_generate_v4(),
  matter_id    uuid not null references public.matters(id) on delete cascade,
  user_id      uuid not null references public.profiles(id),
  date         date not null default current_date,
  duration_min integer not null check (duration_min > 0),
  description  text not null,
  billable     boolean not null default true,
  rate_cents   integer,
  status       public.time_entry_status not null default 'draft',
  invoice_id   uuid,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger time_entries_updated_at
  before update on public.time_entries
  for each row execute function extensions.moddatetime(updated_at);

create index idx_time_entries_matter on public.time_entries(matter_id);
create index idx_time_entries_user on public.time_entries(user_id);

-- ============================================================
-- 9. INVOICES
-- ============================================================
create table public.invoices (
  id              uuid primary key default extensions.uuid_generate_v4(),
  matter_id       uuid not null references public.matters(id) on delete cascade,
  invoice_number  text not null unique,
  status          public.invoice_status not null default 'draft',
  issued_date     date,
  due_date        date,
  total_cents     integer not null default 0,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.time_entries
  add constraint fk_time_entries_invoice
  foreign key (invoice_id) references public.invoices(id) on delete set null;

create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================
-- 10. TRUST / IOLTA LEDGER  (append-only by policy)
-- ============================================================
create table public.trust_ledger (
  id              uuid primary key default extensions.uuid_generate_v4(),
  matter_id       uuid not null references public.matters(id) on delete restrict,
  client_id       uuid not null references public.clients(id) on delete restrict,
  txn_type        public.trust_txn_type not null,
  amount_cents    integer not null check (amount_cents > 0),
  account         public.ledger_account not null default 'trust',
  description     text not null,
  reference       text,
  performed_by    uuid not null references public.profiles(id),
  created_at      timestamptz not null default now()
);

-- No updated_at — trust ledger rows are immutable once created.
create index idx_trust_ledger_matter on public.trust_ledger(matter_id);
create index idx_trust_ledger_client on public.trust_ledger(client_id);

-- ============================================================
-- 11. TRUST LEDGER AUDIT LOG
-- ============================================================
create table public.trust_audit_log (
  id            uuid primary key default extensions.uuid_generate_v4(),
  ledger_id     uuid not null references public.trust_ledger(id) on delete restrict,
  action        text not null,
  performed_by  uuid not null references public.profiles(id),
  details       jsonb default '{}'::jsonb,
  created_at    timestamptz not null default now()
);

create index idx_trust_audit_ledger on public.trust_audit_log(ledger_id);
