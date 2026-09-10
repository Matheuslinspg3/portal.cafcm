begin;

create extension if not exists pg_cron;

create table public.operational_alerts (
  id uuid primary key default gen_random_uuid(),
  alert_key text not null unique check (char_length(alert_key) between 3 and 240),
  source_type text not null check (char_length(source_type) between 2 and 80),
  source_id text not null check (char_length(source_id) between 1 and 120),
  category text not null check (category in ('contract', 'admission', 'document', 'task', 'accounting', 'termination', 'leave')),
  severity text not null check (severity in ('information', 'attention', 'urgent')),
  title text not null check (char_length(trim(title)) between 2 and 180),
  message text not null default '' check (char_length(message) <= 1200),
  due_on date,
  status text not null default 'active' check (status in ('active', 'resolved', 'dismissed')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index operational_alerts_active_severity_due_idx on public.operational_alerts(status, severity, due_on);
create index operational_alerts_source_idx on public.operational_alerts(source_type, source_id);
create trigger operational_alerts_updated_at before update on public.operational_alerts for each row execute function private.set_updated_at();

alter table public.operational_alerts enable row level security;
create policy operational_alerts_cafcm_admin_all on public.operational_alerts for all to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
grant select, insert, update, delete on public.operational_alerts to authenticated;

create function private.refresh_operational_alerts()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.operational_alerts
  set status = 'resolved', resolved_at = now()
  where status = 'active';

  insert into public.operational_alerts (alert_key, source_type, source_id, category, severity, title, message, due_on, status, resolved_at, last_seen_at, metadata)
  select
    'contract:' || c.id::text,
    'contract', c.id::text, 'contract',
    case when c.end_date - current_date <= 7 then 'urgent' when c.end_date - current_date <= 30 then 'attention' else 'information' end,
    'Contrato próximo do encerramento',
    concat('O contrato de ', p.full_name, ' vence em ', greatest(c.end_date - current_date, 0), ' dia(s).'),
    c.end_date, 'active', null, now(),
    jsonb_build_object('apprentice_id', c.apprentice_id, 'company_id', c.company_id, 'days_remaining', c.end_date - current_date)
  from public.contracts c
  join public.profiles p on p.id = c.apprentice_id
  where c.status in ('scheduled', 'active', 'closing')
    and c.end_date between current_date and current_date + 90
  on conflict (alert_key) do update set
    severity = excluded.severity, title = excluded.title, message = excluded.message, due_on = excluded.due_on,
    status = 'active', resolved_at = null, last_seen_at = now(), metadata = excluded.metadata, updated_at = now();

  insert into public.operational_alerts (alert_key, source_type, source_id, category, severity, title, message, due_on, status, resolved_at, last_seen_at, metadata)
  select
    'admission-stalled:' || a.id::text,
    'admission', a.id::text, 'admission',
    case when a.created_at < now() - interval '10 days' then 'urgent' else 'attention' end,
    'Admissão sem avanço',
    concat('A admissão de ', p.full_name, ' está aberta há ', floor(extract(epoch from now() - a.created_at) / 86400), ' dias.'),
    a.target_start_date, 'active', null, now(), jsonb_build_object('apprentice_id', a.apprentice_id, 'company_id', a.company_id, 'status', a.status)
  from public.admission_cases a
  join public.profiles p on p.id = a.apprentice_id
  where a.status not in ('completed', 'cancelled') and a.created_at < now() - interval '5 days'
  on conflict (alert_key) do update set
    severity = excluded.severity, title = excluded.title, message = excluded.message, due_on = excluded.due_on,
    status = 'active', resolved_at = null, last_seen_at = now(), metadata = excluded.metadata, updated_at = now();

  insert into public.operational_alerts (alert_key, source_type, source_id, category, severity, title, message, due_on, status, resolved_at, last_seen_at, metadata)
  select
    'admission-documents:' || a.id::text,
    'admission', a.id::text, 'document', 'attention',
    'Documentos pendentes na admissão',
    concat(p.full_name, ' possui ', count(i.id), ' item(ns) obrigatório(s) pendente(s).'),
    a.target_start_date, 'active', null, now(), jsonb_build_object('apprentice_id', a.apprentice_id, 'company_id', a.company_id, 'pending_items', count(i.id))
  from public.admission_cases a
  join public.profiles p on p.id = a.apprentice_id
  join public.admission_checklist_items i on i.admission_id = a.id and i.is_required and not i.is_completed
  where a.status not in ('completed', 'cancelled')
  group by a.id, p.full_name
  on conflict (alert_key) do update set
    message = excluded.message, due_on = excluded.due_on, status = 'active', resolved_at = null,
    last_seen_at = now(), metadata = excluded.metadata, updated_at = now();

  insert into public.operational_alerts (alert_key, source_type, source_id, category, severity, title, message, due_on, status, resolved_at, last_seen_at, metadata)
  select
    'task-overdue:' || t.id::text,
    'task', t.id::text, 'task', 'urgent', 'Tarefa vencida',
    concat(t.title, ' estava prevista para ', to_char(t.due_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'), '.'),
    t.due_at::date, 'active', null, now(), jsonb_build_object('assigned_to', t.assigned_to, 'company_id', t.company_id, 'apprentice_id', t.apprentice_id)
  from public.tasks t
  where t.status not in ('completed', 'cancelled') and t.due_at < now()
  on conflict (alert_key) do update set
    message = excluded.message, due_on = excluded.due_on, status = 'active', resolved_at = null,
    last_seen_at = now(), metadata = excluded.metadata, updated_at = now();

  insert into public.operational_alerts (alert_key, source_type, source_id, category, severity, title, message, due_on, status, resolved_at, last_seen_at, metadata)
  select
    'accounting-overdue:' || d.id::text,
    'accounting', d.id::text, 'accounting', 'attention', 'Retorno pendente da contabilidade',
    concat(d.title, ' estava previsto para ', to_char(d.due_at at time zone 'America/Sao_Paulo', 'DD/MM/YYYY HH24:MI'), '.'),
    d.due_at::date, 'active', null, now(), jsonb_build_object('apprentice_id', d.apprentice_id, 'company_id', d.company_id, 'status', d.status)
  from public.accounting_dispatches d
  where d.status not in ('completed', 'verified') and d.due_at < now()
  on conflict (alert_key) do update set
    message = excluded.message, due_on = excluded.due_on, status = 'active', resolved_at = null,
    last_seen_at = now(), metadata = excluded.metadata, updated_at = now();
end;
$$;
revoke all on function private.refresh_operational_alerts() from public, anon, authenticated;

select private.refresh_operational_alerts();
select cron.schedule('cafcm-refresh-operational-alerts', '10 6 * * *', 'select private.refresh_operational_alerts()');

commit;
