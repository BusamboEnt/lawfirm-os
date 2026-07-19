# Law Firm OS

Internal practice management platform for law firms. Built with Next.js (App Router) and Supabase.

## Modules

- **Matters** — case management with per-matter access scoping
- **Clients / CRM** — contact management with conflict-check support
- **Documents** — per-matter document storage with version history
- **Calendar / Tasks** — deadlines, court dates, statute-of-limitations tracking
- **Time & Billing** — time entries and invoice generation
- **Trust / IOLTA Ledger** — append-only trust accounting with full audit trail

## Stack

- **Framework:** Next.js 15 (App Router, Server Components)
- **Database & Auth:** Supabase (Postgres + Row Level Security + Auth)
- **Storage:** Supabase Storage
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting Started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

3. Run the Supabase migrations against your project:

```bash
npx supabase db push
```

This creates all tables, RLS policies, trust-ledger immutability triggers,
and the private `documents` storage bucket with per-matter access policies.

4. Start the dev server:

```bash
npm run dev
```

## Database Schema

Migrations are in `supabase/migrations/` and cover:

- `00001_initial_schema.sql` — all tables, enums, indexes
- `00002_rls_policies.sql` — row-level security with per-matter access scoping
- `00003_trust_immutability.sql` — database-level immutability triggers for trust ledger
- `00004_profile_trigger.sql` — auto-create profile on auth signup
- `00005_storage.sql` — private `documents` bucket with per-matter storage policies
- `00006_document_access_log.sql` — append-only audit log of document views/downloads/uploads

## Deadline Email Digest

`/api/deadline-digest` emails each user their tasks due within 7 days
(SOL deadlines, court dates, and overdue items flagged). It runs weekdays
at 12:00 UTC via Vercel Cron (`vercel.json`) and needs three env vars:
`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` ([resend.com](https://resend.com)),
and `EMAIL_FROM`. Set `CRON_SECRET` to require a
`Authorization: Bearer <secret>` header — Vercel Cron sends it automatically.

## Security

- Row-level security enforced at the database level (not just UI checks)
- Per-matter access scoping — users only see matters they are assigned to
- Partners and admins have broad access across all matters
- Trust ledger is append-only — immutability enforced by database triggers, not just RLS
- All trust transactions are auto-logged to an audit trail
