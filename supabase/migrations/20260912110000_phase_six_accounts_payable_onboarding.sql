begin;

-- Phase 6: operational accounts payable and action-oriented onboarding.
-- Payments remain manually confirmed. No bank instruction is created here.

create table public.accounts_payable (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null check (char_length(trim(supplier_name)) between 2 and 200),
  supplier_document text check (supplier_document is null or char_length(trim(supplier_document)) between 3 and 32),
  category text not null check (char_length(trim(category)) between 2 and 80),
  description text not null check (char_length(trim(description)) between 2 and 240),
  competence date,
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  planned_payment_date date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'scheduled', 'paid', 'cancelled')),
  payment_method text not null default 'manual' check (payment_method in ('manual', 'bradesco')),
  barcode text check (barcode is null or char_length(trim(barcode)) between 20 and 260),
  external_reference text check (external_reference is null or char_length(trim(external_reference)) between 2 and 160),
  document_id uuid references public.document_records(id) on delete set null,
  receipt_document_id uuid references public.document_records(id) on delete set null,
  responsible_id uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  paid_at timestamptz,
  paid_amount numeric(12,2) check (paid_amount is null or paid_amount >= 0),
  reminder_days integer[] not null default array[7,3,1] check (cardinality(reminder_days) between 1 and 5),
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_payable_dates_check check (planned_payment_date is null or planned_payment_date >= due_date - 3650),
  constraint accounts_payable_payment_check check (
    (status = 'paid' and paid_at is not null and paid_amount is not null)
    or (status <> 'paid')
  )
);

create index accounts_payable_due_status_idx
  on public.accounts_payable(due_date, status)
  where status not in ('paid', 'cancelled');
create index accounts_payable_responsible_idx
  on public.accounts_payable(responsible_id)
  where responsible_id is not null;
create index accounts_payable_document_idx
  on public.accounts_payable(document_id)
  where document_id is not null;
create index accounts_payable_created_by_idx
  on public.accounts_payable(created_by)
  where created_by is not null;

create trigger accounts_payable_updated_at before update on public.accounts_payable
for each row execute function private.set_updated_at();

create function private.sync_accounts_payable_milestones()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('approved', 'scheduled', 'paid') and new.approved_at is null then
    new.approved_at := now();
    new.approved_by := (select auth.uid());
  elsif new.status = 'pending' then
    new.approved_at := null;
    new.approved_by := null;
  end if;

  if new.status = 'paid' then
    new.paid_at := coalesce(new.paid_at, now());
    new.paid_amount := coalesce(new.paid_amount, new.amount);
  elsif tg_op = 'UPDATE' and old.status = 'paid' and new.status <> 'paid' then
    new.paid_at := null;
    new.paid_amount := null;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_accounts_payable_milestones() from public, anon, authenticated;

create trigger accounts_payable_milestones before insert or update of status on public.accounts_payable
for each row execute function private.sync_accounts_payable_milestones();
create trigger accounts_payable_audit after insert or update or delete on public.accounts_payable
for each row execute function private.capture_administrative_audit();

alter table public.accounts_payable enable row level security;
revoke all on table public.accounts_payable from public, anon;
grant select, insert, update, delete on table public.accounts_payable to authenticated;
grant all on table public.accounts_payable to service_role;

create policy accounts_payable_cafcm_admin_all on public.accounts_payable
for all to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy accounts_payable_department_select on public.accounts_payable
as restrictive for select to authenticated
using ((select private.has_portal_permission('finance.read')));
create policy accounts_payable_department_insert on public.accounts_payable
as restrictive for insert to authenticated
with check ((select private.has_portal_permission('finance.manage')));
create policy accounts_payable_department_update on public.accounts_payable
as restrictive for update to authenticated
using ((select private.has_portal_permission('finance.manage')))
with check ((select private.has_portal_permission('finance.manage')));
create policy accounts_payable_department_delete on public.accounts_payable
as restrictive for delete to authenticated
using ((select private.has_portal_permission('finance.manage')));

create or replace function private.refresh_phase_six_finance_alerts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.operational_alerts(alert_key, source_type, source_id, category, severity, title, message, due_on, status, resolved_at, last_seen_at, metadata)
  select
    'account-payable:' || payable.id::text,
    'account_payable', payable.id::text, 'finance',
    case when payable.due_date < current_date then 'urgent' else 'attention' end,
    case when payable.due_date < current_date then 'Conta a pagar vencida' else 'Conta a pagar próxima do vencimento' end,
    concat(payable.supplier_name, ' · ', payable.description, ' · vence ', to_char(payable.due_date, 'DD/MM/YYYY'), ' · R$ ', to_char(payable.amount, 'FM999G999G990D00'), '.'),
    payable.due_date, 'active', null, now(),
    jsonb_build_object('responsible_id', payable.responsible_id, 'status', payable.status, 'payment_method', payable.payment_method)
  from public.accounts_payable payable
  where payable.status not in ('paid', 'cancelled')
    and payable.due_date <= current_date + coalesce((select max(day_value) from unnest(payable.reminder_days) as day_value), 7)
  on conflict(alert_key) do update set
    severity = excluded.severity, title = excluded.title, message = excluded.message, due_on = excluded.due_on,
    status = 'active', resolved_at = null, last_seen_at = now(), metadata = excluded.metadata, updated_at = now();
end;
$$;
revoke all on function private.refresh_phase_six_finance_alerts() from public, anon, authenticated;

create or replace function private.run_phase_four_automations(run_source_value text, actor_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare run_id uuid; active_alerts integer; open_notifications integer; open_tasks integer;
begin
  insert into public.automation_runs(run_source,status,executed_by) values(run_source_value,'running',actor_id) returning id into run_id;
  perform private.refresh_phase_four_alerts();
  perform private.refresh_phase_six_finance_alerts();
  perform private.sync_phase_four_work();
  select count(*) into active_alerts from public.operational_alerts where status='active';
  select count(*) into open_notifications from public.notifications where status='open';
  select count(*) into open_tasks from public.tasks where status not in ('completed','cancelled');
  update public.automation_runs set status='completed',finished_at=now(),alerts_active=active_alerts,notifications_open=open_notifications,tasks_open=open_tasks where id=run_id;
  return jsonb_build_object('ok',true,'run_id',run_id,'alerts_active',active_alerts,'notifications_open',open_notifications,'tasks_open',open_tasks);
exception when others then
  if run_id is not null then
    update public.automation_runs set status='failed',finished_at=now(),error_message=left(sqlerrm,2000) where id=run_id;
  end if;
  return jsonb_build_object('ok',false,'run_id',run_id,'error','Não foi possível concluir a atualização automática.');
end;
$$;
revoke all on function private.run_phase_four_automations(text,uuid) from public, anon, authenticated;

commit;
