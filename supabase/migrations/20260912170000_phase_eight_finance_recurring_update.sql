begin;

-- Support for payable recurring charges (custos fixos)
alter table public.recurring_charges add column if not exists charge_type text not null default 'receivable' check (charge_type in ('receivable', 'payable'));
alter table public.recurring_charges alter column company_id drop not null;
alter table public.recurring_charges add column if not exists supplier_name text check (supplier_name is null or char_length(trim(supplier_name)) between 2 and 200);

-- Make sure we can track payable generation idempotency
alter table public.accounts_payable add column if not exists recurring_charge_id uuid references public.recurring_charges(id) on delete set null;
alter table public.accounts_payable add column if not exists batch_id uuid references public.charge_batches(id) on delete set null;
alter table public.accounts_payable drop constraint if exists unique_payable_recurring_competence;
alter table public.accounts_payable add constraint unique_payable_recurring_competence unique (recurring_charge_id, competence);

-- Ensure audit triggers for manual payments
create trigger financial_charges_audit after insert or update or delete on public.financial_charges for each row execute function private.capture_administrative_audit();
create trigger accounts_payable_audit after insert or update or delete on public.accounts_payable for each row execute function private.capture_administrative_audit();

commit;
