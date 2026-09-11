begin;

-- Phase 3 keeps the administrative operation manual and traceable. Automated
-- reminders, cross-module tasks and banking integrations remain outside this phase.

alter table public.leave_records
  add column if not exists company_id uuid references public.companies(id) on delete set null,
  add column if not exists actual_return_date date;

alter table public.leave_records
  drop constraint if exists leave_records_actual_return_check;
alter table public.leave_records
  add constraint leave_records_actual_return_check
  check (actual_return_date is null or actual_return_date >= start_date);

alter table public.termination_cases
  add column if not exists termination_amount numeric(12,2),
  add column if not exists payment_date date;

alter table public.termination_cases
  drop constraint if exists termination_cases_amount_check;
alter table public.termination_cases
  add constraint termination_cases_amount_check
  check (termination_amount is null or termination_amount >= 0);

alter table public.accounting_dispatches
  add column if not exists competence date,
  add column if not exists external_reference text,
  add column if not exists document_id uuid references public.document_records(id) on delete set null;

alter table public.accounting_dispatches
  drop constraint if exists accounting_dispatches_external_reference_check;
alter table public.accounting_dispatches
  add constraint accounting_dispatches_external_reference_check
  check (external_reference is null or char_length(external_reference) <= 180);

alter table public.document_records
  add column if not exists expires_on date,
  add column if not exists notes text not null default '',
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz;

alter table public.document_records
  drop constraint if exists document_records_category_check;
alter table public.document_records
  add constraint document_records_category_check
  check (category in (
    'admission', 'contract', 'documents', 'vacation', 'leave', 'termination',
    'accounting', 'finance', 'payroll', 'registration_change', 'invoice',
    'payment_slip', 'receipt', 'other'
  ));

alter table public.document_records
  drop constraint if exists document_records_notes_check;
alter table public.document_records
  add constraint document_records_notes_check check (char_length(notes) <= 4000);

alter table public.document_records
  drop constraint if exists document_records_archive_check;
alter table public.document_records
  add constraint document_records_archive_check
  check ((is_archived and archived_at is not null) or (not is_archived and archived_at is null));

create table public.financial_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  pipeline_item_id uuid references public.pipeline_items(id) on delete set null,
  competence date not null,
  description text not null check (char_length(trim(description)) between 2 and 240),
  amount numeric(12,2) not null check (amount >= 0),
  due_date date,
  status text not null default 'to_invoice' check (status in (
    'to_invoice', 'invoice_issued', 'payment_slip_issued', 'sent', 'to_due',
    'overdue', 'collection', 'paid', 'cancelled'
  )),
  invoice_number text check (invoice_number is null or char_length(invoice_number) <= 120),
  invoice_issued_at timestamptz,
  payment_slip_number text check (payment_slip_number is null or char_length(payment_slip_number) <= 160),
  payment_slip_line text check (payment_slip_line is null or char_length(payment_slip_line) <= 240),
  payment_slip_url text check (payment_slip_url is null or char_length(payment_slip_url) <= 2048),
  payment_slip_issued_at timestamptz,
  sent_at timestamptz,
  paid_at timestamptz,
  paid_amount numeric(12,2) check (paid_amount is null or paid_amount >= 0),
  invoice_document_id uuid references public.document_records(id) on delete set null,
  payment_slip_document_id uuid references public.document_records(id) on delete set null,
  receipt_document_id uuid references public.document_records(id) on delete set null,
  responsible_id uuid references public.profiles(id) on delete set null,
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_requirements (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid references public.profiles(id) on delete restrict,
  company_id uuid references public.companies(id) on delete restrict,
  admission_id uuid references public.admission_cases(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete cascade,
  leave_id uuid references public.leave_records(id) on delete cascade,
  termination_id uuid references public.termination_cases(id) on delete cascade,
  document_id uuid references public.document_records(id) on delete set null,
  category text not null check (category in (
    'admission', 'contract', 'documents', 'vacation', 'leave', 'termination',
    'accounting', 'finance', 'payroll', 'registration_change', 'invoice',
    'payment_slip', 'receipt', 'other'
  )),
  title text not null check (char_length(trim(title)) between 2 and 180),
  status text not null default 'pending' check (status in ('pending', 'received', 'verified', 'waived')),
  due_date date,
  received_at timestamptz,
  verified_at timestamptz,
  responsible_id uuid references public.profiles(id) on delete set null,
  notes text not null default '' check (char_length(notes) <= 4000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_requirements_subject_check check (
    apprentice_id is not null or company_id is not null or admission_id is not null
    or contract_id is not null or leave_id is not null or termination_id is not null
  )
);

create table public.termination_checklist_items (
  id uuid primary key default gen_random_uuid(),
  termination_id uuid not null references public.termination_cases(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  position integer not null check (position > 0),
  is_required boolean not null default true,
  is_completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  document_id uuid references public.document_records(id) on delete set null,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (termination_id, position),
  constraint termination_checklist_completion_check check (
    (is_completed and completed_at is not null)
    or (not is_completed and completed_at is null and completed_by is null)
  )
);

create index leave_records_company_id_idx on public.leave_records(company_id) where company_id is not null;
create index accounting_dispatches_document_id_idx on public.accounting_dispatches(document_id) where document_id is not null;
create index document_records_active_created_idx on public.document_records(is_archived, created_at desc);

create index financial_charges_company_status_idx on public.financial_charges(company_id, status);
create index financial_charges_due_status_idx on public.financial_charges(due_date, status) where status not in ('paid', 'cancelled');
create index financial_charges_competence_idx on public.financial_charges(competence desc);
create index financial_charges_contract_id_idx on public.financial_charges(contract_id) where contract_id is not null;
create index financial_charges_pipeline_item_id_idx on public.financial_charges(pipeline_item_id) where pipeline_item_id is not null;
create index financial_charges_invoice_document_id_idx on public.financial_charges(invoice_document_id) where invoice_document_id is not null;
create index financial_charges_payment_slip_document_id_idx on public.financial_charges(payment_slip_document_id) where payment_slip_document_id is not null;
create index financial_charges_receipt_document_id_idx on public.financial_charges(receipt_document_id) where receipt_document_id is not null;
create index financial_charges_responsible_id_idx on public.financial_charges(responsible_id) where responsible_id is not null;
create index financial_charges_created_by_idx on public.financial_charges(created_by) where created_by is not null;

create index document_requirements_apprentice_status_idx on public.document_requirements(apprentice_id, status) where apprentice_id is not null;
create index document_requirements_company_status_idx on public.document_requirements(company_id, status) where company_id is not null;
create index document_requirements_due_status_idx on public.document_requirements(due_date, status) where status = 'pending';
create index document_requirements_admission_id_idx on public.document_requirements(admission_id) where admission_id is not null;
create index document_requirements_contract_id_idx on public.document_requirements(contract_id) where contract_id is not null;
create index document_requirements_leave_id_idx on public.document_requirements(leave_id) where leave_id is not null;
create index document_requirements_termination_id_idx on public.document_requirements(termination_id) where termination_id is not null;
create index document_requirements_document_id_idx on public.document_requirements(document_id) where document_id is not null;
create index document_requirements_responsible_id_idx on public.document_requirements(responsible_id) where responsible_id is not null;
create index document_requirements_created_by_idx on public.document_requirements(created_by) where created_by is not null;

create index termination_checklist_completed_by_idx on public.termination_checklist_items(completed_by) where completed_by is not null;
create index termination_checklist_document_id_idx on public.termination_checklist_items(document_id) where document_id is not null;

create trigger financial_charges_updated_at before update on public.financial_charges
for each row execute function private.set_updated_at();
create trigger document_requirements_updated_at before update on public.document_requirements
for each row execute function private.set_updated_at();
create trigger termination_checklist_updated_at before update on public.termination_checklist_items
for each row execute function private.set_updated_at();

create function private.validate_phase_three_relationships()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  related_apprentice uuid;
  related_company uuid;
begin
  if tg_table_name = 'leave_records' and new.contract_id is not null then
    select contract.apprentice_id, contract.company_id
      into related_apprentice, related_company
    from public.contracts contract
    where contract.id = new.contract_id;

    if related_apprentice is distinct from new.apprentice_id then
      raise exception 'O contrato informado não pertence ao jovem selecionado.';
    end if;
    if new.company_id is not null and related_company is distinct from new.company_id then
      raise exception 'O contrato informado não pertence à empresa selecionada.';
    end if;
    new.company_id := related_company;
  elsif tg_table_name = 'financial_charges' and new.contract_id is not null then
    select contract.company_id
      into related_company
    from public.contracts contract
    where contract.id = new.contract_id;

    if related_company is distinct from new.company_id then
      raise exception 'O contrato informado não pertence à empresa selecionada.';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.validate_phase_three_relationships() from public, anon, authenticated;

create trigger leave_records_validate_relationships
before insert or update of apprentice_id, company_id, contract_id on public.leave_records
for each row execute function private.validate_phase_three_relationships();
create trigger financial_charges_validate_relationships
before insert or update of company_id, contract_id on public.financial_charges
for each row execute function private.validate_phase_three_relationships();

create function private.capture_phase_three_milestones()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_table_name = 'financial_charges' then
    if new.status = 'invoice_issued' and new.invoice_issued_at is null then new.invoice_issued_at := now(); end if;
    if new.status = 'payment_slip_issued' and new.payment_slip_issued_at is null then new.payment_slip_issued_at := now(); end if;
    if new.status in ('sent', 'to_due') and new.sent_at is null then new.sent_at := now(); end if;
    if new.status = 'paid' and new.paid_at is null then new.paid_at := now(); end if;
  elsif tg_table_name = 'accounting_dispatches' then
    if new.status in ('sent', 'waiting_response') and new.sent_at is null then new.sent_at := now(); end if;
    if new.status = 'received' and new.received_at is null then new.received_at := now(); end if;
    if new.status in ('verified', 'completed') and new.verified_at is null then new.verified_at := now(); end if;
  elsif tg_table_name = 'document_requirements' then
    if new.status in ('received', 'verified') and new.received_at is null then new.received_at := now(); end if;
    if new.status = 'verified' and new.verified_at is null then new.verified_at := now(); end if;
  end if;
  return new;
end;
$$;
revoke all on function private.capture_phase_three_milestones() from public, anon, authenticated;

create trigger financial_charges_milestones before insert or update of status on public.financial_charges
for each row execute function private.capture_phase_three_milestones();
create trigger accounting_dispatches_milestones before insert or update of status on public.accounting_dispatches
for each row execute function private.capture_phase_three_milestones();
create trigger document_requirements_milestones before insert or update of status on public.document_requirements
for each row execute function private.capture_phase_three_milestones();

create function private.sync_termination_checklist_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_completed and (tg_op = 'INSERT' or not old.is_completed) then
    new.completed_at := now();
    new.completed_by := (select auth.uid());
  elsif not new.is_completed then
    new.completed_at := null;
    new.completed_by := null;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_termination_checklist_completion() from public, anon, authenticated;

create trigger termination_checklist_completion before insert or update of is_completed on public.termination_checklist_items
for each row execute function private.sync_termination_checklist_completion();

create function private.seed_termination_checklist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.termination_checklist_items (termination_id, title, position)
  values
    (new.id, 'Confirmar solicitação e data do desligamento', 10),
    (new.id, 'Providenciar exame demissional', 20),
    (new.id, 'Enviar informações à contabilidade', 30),
    (new.id, 'Conferir valores e documentos da rescisão', 40),
    (new.id, 'Registrar pagamento da rescisão', 50),
    (new.id, 'Entregar documentos ao jovem', 60),
    (new.id, 'Arquivar o processo e encerrar o vínculo', 70)
  on conflict (termination_id, position) do nothing;
  return new;
end;
$$;
revoke all on function private.seed_termination_checklist() from public, anon, authenticated;

create trigger termination_cases_seed_checklist after insert on public.termination_cases
for each row execute function private.seed_termination_checklist();

create trigger financial_charges_audit after insert or update or delete on public.financial_charges
for each row execute function private.capture_administrative_audit();
create trigger document_requirements_audit after insert or update or delete on public.document_requirements
for each row execute function private.capture_administrative_audit();
create trigger termination_checklist_audit after insert or update or delete on public.termination_checklist_items
for each row execute function private.capture_administrative_audit();

alter table public.financial_charges enable row level security;
alter table public.document_requirements enable row level security;
alter table public.termination_checklist_items enable row level security;

revoke all on table public.financial_charges, public.document_requirements, public.termination_checklist_items from public, anon;
grant select, insert, update, delete on table public.financial_charges, public.document_requirements, public.termination_checklist_items to authenticated;
grant all on table public.financial_charges, public.document_requirements, public.termination_checklist_items to service_role;

create policy financial_charges_cafcm_admin_all on public.financial_charges
for all to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy financial_charges_department_select on public.financial_charges
as restrictive for select to authenticated
using ((select private.has_portal_permission('finance.read')));
create policy financial_charges_department_insert on public.financial_charges
as restrictive for insert to authenticated
with check ((select private.has_portal_permission('finance.manage')));
create policy financial_charges_department_update on public.financial_charges
as restrictive for update to authenticated
using ((select private.has_portal_permission('finance.manage')))
with check ((select private.has_portal_permission('finance.manage')));
create policy financial_charges_department_delete on public.financial_charges
as restrictive for delete to authenticated
using ((select private.has_portal_permission('finance.manage')));

create policy document_requirements_cafcm_admin_all on public.document_requirements
for all to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy document_requirements_department_select on public.document_requirements
as restrictive for select to authenticated
using ((select private.has_portal_permission('documents.read')));
create policy document_requirements_department_insert on public.document_requirements
as restrictive for insert to authenticated
with check ((select private.has_portal_permission('documents.manage')));
create policy document_requirements_department_update on public.document_requirements
as restrictive for update to authenticated
using ((select private.has_portal_permission('documents.manage')))
with check ((select private.has_portal_permission('documents.manage')));
create policy document_requirements_department_delete on public.document_requirements
as restrictive for delete to authenticated
using ((select private.has_portal_permission('documents.manage')));

create policy termination_checklist_cafcm_admin_all on public.termination_checklist_items
for all to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy termination_checklist_department_select on public.termination_checklist_items
as restrictive for select to authenticated
using ((select private.has_portal_permission('personnel.read')));
create policy termination_checklist_department_insert on public.termination_checklist_items
as restrictive for insert to authenticated
with check ((select private.has_portal_permission('personnel.manage')));
create policy termination_checklist_department_update on public.termination_checklist_items
as restrictive for update to authenticated
using ((select private.has_portal_permission('personnel.manage')))
with check ((select private.has_portal_permission('personnel.manage')));
create policy termination_checklist_department_delete on public.termination_checklist_items
as restrictive for delete to authenticated
using ((select private.has_portal_permission('personnel.manage')));

commit;
