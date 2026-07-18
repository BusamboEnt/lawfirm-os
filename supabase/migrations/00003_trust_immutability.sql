-- Enforce trust ledger immutability at the database level.
-- Even if RLS is bypassed (e.g. service role), these triggers prevent
-- UPDATE and DELETE on trust_ledger and trust_audit_log.

create or replace function public.prevent_trust_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Trust ledger entries are immutable and cannot be modified or deleted';
end;
$$;

create trigger trust_ledger_no_update
  before update on public.trust_ledger
  for each row execute function public.prevent_trust_ledger_mutation();

create trigger trust_ledger_no_delete
  before delete on public.trust_ledger
  for each row execute function public.prevent_trust_ledger_mutation();

create trigger trust_audit_log_no_update
  before update on public.trust_audit_log
  for each row execute function public.prevent_trust_ledger_mutation();

create trigger trust_audit_log_no_delete
  before delete on public.trust_audit_log
  for each row execute function public.prevent_trust_ledger_mutation();

-- Auto-log trust ledger inserts to the audit log
create or replace function public.log_trust_entry()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.trust_audit_log (ledger_id, action, performed_by, details)
  values (
    new.id,
    'created',
    new.performed_by,
    jsonb_build_object(
      'txn_type', new.txn_type,
      'amount_cents', new.amount_cents,
      'account', new.account,
      'matter_id', new.matter_id,
      'client_id', new.client_id
    )
  );
  return new;
end;
$$;

create trigger trust_ledger_audit
  after insert on public.trust_ledger
  for each row execute function public.log_trust_entry();
