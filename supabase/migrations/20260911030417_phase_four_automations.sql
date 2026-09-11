begin;

-- Phase 4: operational automations, controlled communication, generated documents
-- and the data foundation for a future Bradesco integration.

alter table public.operational_alerts drop constraint if exists operational_alerts_category_check;
alter table public.operational_alerts add constraint operational_alerts_category_check check (
  category in (
    'contract', 'admission', 'document', 'task', 'accounting', 'termination',
    'leave', 'vacancy', 'finance', 'recruitment', 'academic'
  )
);

alter table public.notifications
  add column source_alert_id uuid references public.operational_alerts(id) on delete set null,
  add column automation_key text,
  add column status text not null default 'open',
  add column priority text not null default 'normal',
  add column due_at timestamptz,
  add column target_view text not null default '',
  add column resolved_at timestamptz,
  add column updated_at timestamptz not null default now();

alter table public.notifications add constraint notifications_status_check
  check (status in ('open', 'resolved', 'dismissed'));
alter table public.notifications add constraint notifications_priority_check
  check (priority in ('low', 'normal', 'high', 'urgent'));
alter table public.notifications add constraint notifications_automation_key_length_check
  check (automation_key is null or char_length(automation_key) between 3 and 260);
alter table public.notifications add constraint notifications_target_view_length_check
  check (char_length(target_view) <= 80);

create unique index notifications_automation_key_unique_idx
  on public.notifications(automation_key)
  where automation_key is not null;
create index notifications_recipient_status_created_idx
  on public.notifications(recipient_id, status, created_at desc);
create index notifications_source_alert_idx
  on public.notifications(source_alert_id)
  where source_alert_id is not null;
create trigger notifications_updated_at before update on public.notifications
for each row execute function private.set_updated_at();

alter table public.email_deliveries drop constraint if exists email_deliveries_status_check;
alter table public.email_deliveries
  alter column status set default 'draft',
  add column body text not null default '',
  add column approved_by uuid references public.profiles(id) on delete set null,
  add column approved_at timestamptz,
  add column scheduled_at timestamptz,
  add column last_attempt_at timestamptz,
  add column attempt_count integer not null default 0,
  add column attachment_document_id uuid references public.document_records(id) on delete set null,
  add column metadata jsonb not null default '{}'::jsonb;

alter table public.email_deliveries add constraint email_deliveries_status_check
  check (status in ('draft', 'approved', 'queued', 'sending', 'sent', 'failed', 'cancelled'));
alter table public.email_deliveries add constraint email_deliveries_body_length_check
  check (char_length(body) <= 100000);
alter table public.email_deliveries add constraint email_deliveries_attempt_count_check
  check (attempt_count >= 0);
alter table public.email_deliveries add constraint email_deliveries_metadata_object_check
  check (jsonb_typeof(metadata) = 'object');

alter table public.email_templates
  add column category text not null default 'general',
  add column requires_approval boolean not null default true;

create table public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  run_source text not null check (run_source in ('schedule', 'manual', 'system')),
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  alerts_active integer not null default 0 check (alerts_active >= 0),
  notifications_open integer not null default 0 check (notifications_open >= 0),
  tasks_open integer not null default 0 check (tasks_open >= 0),
  error_message text check (error_message is null or char_length(error_message) <= 2000),
  executed_by uuid references public.profiles(id) on delete set null,
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now()
);

create table public.document_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 160),
  category text not null check (category in ('declaration', 'request', 'receipt', 'report', 'other')),
  title_template text not null check (char_length(trim(title_template)) between 2 and 220),
  body_template text not null check (char_length(trim(body_template)) between 2 and 50000),
  is_active boolean not null default true,
  requires_review boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_generations (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.document_templates(id) on delete restrict,
  document_id uuid references public.document_records(id) on delete set null,
  apprentice_id uuid references public.profiles(id) on delete restrict,
  company_id uuid references public.companies(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  title text not null check (char_length(trim(title)) between 2 and 220),
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  notes text not null default '' check (char_length(notes) <= 12000),
  generated_by uuid references public.profiles(id) on delete set null default auth.uid(),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_generations_subject_check check (apprentice_id is not null or company_id is not null),
  constraint document_generations_review_check check (
    (status = 'draft' and reviewed_by is null and reviewed_at is null)
    or (status in ('approved', 'rejected') and reviewed_by is not null and reviewed_at is not null)
  )
);

create table public.banking_integrations (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'Bradesco' check (provider = 'Bradesco'),
  bank_code text not null default '237' check (bank_code = '237'),
  integration_mode text not null default 'cnab240' check (integration_mode in ('cnab240', 'cnab400', 'api')),
  status text not null default 'awaiting_documents' check (status in ('awaiting_documents', 'configuring', 'homologation', 'active', 'inactive')),
  agreement_number text check (agreement_number is null or char_length(agreement_number) <= 80),
  wallet_code text check (wallet_code is null or char_length(wallet_code) <= 40),
  layout_version text check (layout_version is null or char_length(layout_version) <= 40),
  agency text check (agency is null or char_length(agency) <= 20),
  account_reference text check (account_reference is null or char_length(account_reference) <= 40),
  homologated_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bank_file_batches (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.banking_integrations(id) on delete restrict,
  direction text not null check (direction in ('remittance', 'return')),
  status text not null default 'draft' check (status in ('draft', 'generated', 'uploaded', 'processing', 'processed', 'failed', 'cancelled')),
  file_name text check (file_name is null or char_length(file_name) <= 255),
  storage_path text check (storage_path is null or char_length(storage_path) <= 1024),
  file_digest text check (file_digest is null or char_length(file_digest) <= 128),
  record_count integer not null default 0 check (record_count >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index automation_runs_started_idx on public.automation_runs(started_at desc);
create index document_generations_status_created_idx on public.document_generations(status, created_at desc);
create index document_generations_apprentice_idx on public.document_generations(apprentice_id) where apprentice_id is not null;
create index document_generations_company_idx on public.document_generations(company_id) where company_id is not null;
create index document_generations_document_idx on public.document_generations(document_id) where document_id is not null;
create index bank_file_batches_integration_created_idx on public.bank_file_batches(integration_id, created_at desc);
create index email_deliveries_scheduled_status_idx on public.email_deliveries(status, scheduled_at) where status in ('approved', 'queued');
create index email_deliveries_attachment_idx on public.email_deliveries(attachment_document_id) where attachment_document_id is not null;

create trigger document_templates_updated_at before update on public.document_templates
for each row execute function private.set_updated_at();
create trigger document_generations_updated_at before update on public.document_generations
for each row execute function private.set_updated_at();
create trigger banking_integrations_updated_at before update on public.banking_integrations
for each row execute function private.set_updated_at();
create trigger bank_file_batches_updated_at before update on public.bank_file_batches
for each row execute function private.set_updated_at();

create trigger document_templates_audit after insert or update or delete on public.document_templates
for each row execute function private.capture_administrative_audit();
create trigger document_generations_audit after insert or update or delete on public.document_generations
for each row execute function private.capture_administrative_audit();
create trigger banking_integrations_audit after insert or update or delete on public.banking_integrations
for each row execute function private.capture_administrative_audit();
create trigger bank_file_batches_audit after insert or update or delete on public.bank_file_batches
for each row execute function private.capture_administrative_audit();

insert into public.email_templates (slug, name, subject, body, category, requires_approval)
values
  ('solicitacao-documentos', 'Solicitação de documentos', 'CAFCM · Documentos pendentes', 'Olá, {{nome}}. Para dar continuidade ao atendimento, precisamos receber: {{documentos}}. Prazo: {{prazo}}. Em caso de dúvida, fale com a equipe CAFCM.', 'documents', true),
  ('admissao-concluida', 'Admissão concluída', 'CAFCM · Admissão concluída', 'Olá, {{nome}}. A etapa de admissão foi concluída. Início previsto: {{data_inicio}}. Consulte a equipe CAFCM caso precise confirmar alguma informação.', 'personnel', true),
  ('contrato-proximo-vencimento', 'Contrato próximo do vencimento', 'CAFCM · Contrato próximo do vencimento', 'Olá, {{nome}}. O contrato acompanhado pela CAFCM possui término previsto em {{data_termino}}. Este aviso não altera o contrato; as providências serão confirmadas pela equipe responsável.', 'personnel', true),
  ('cobranca-empresa', 'Cobrança para empresa', 'CAFCM · Cobrança {{competencia}}', 'Olá, {{nome}}. Seguem as informações da cobrança referente a {{competencia}}, com vencimento em {{vencimento}}. Valor: {{valor}}. A documentação correspondente deve ser conferida antes do pagamento.', 'finance', true)
on conflict (slug) do update set
  name = excluded.name,
  subject = excluded.subject,
  body = excluded.body,
  category = excluded.category,
  requires_approval = excluded.requires_approval,
  is_active = true,
  updated_at = now();

insert into public.document_templates (slug, name, category, title_template, body_template, requires_review)
values
  ('declaracao-vinculo', 'Declaração de vínculo', 'declaration', 'Declaração de vínculo · {{jovem}}', 'A CAFCM declara, para os fins solicitados, que {{jovem}} consta em seus registros de acompanhamento, vinculado(a) à empresa {{empresa}}.\n\nPeríodo informado: {{periodo}}.\n\nEsta declaração deve ser revisada e aprovada pela equipe responsável antes do uso externo.', true),
  ('solicitacao-documentos', 'Solicitação de documentos', 'request', 'Solicitação de documentos · {{jovem}}', 'Solicitamos o envio dos seguintes documentos: {{documentos}}.\n\nPrazo informado: {{prazo}}.\n\nObservações: {{observacoes}}.', true),
  ('recibo-simples', 'Recibo simples', 'receipt', 'Recibo · {{empresa}} · {{competencia}}', 'Referência: {{descricao}}.\nEmpresa: {{empresa}}.\nCompetência: {{competencia}}.\nValor informado: {{valor}}.\n\nEste documento somente terá validade após conferência e aprovação do Financeiro da CAFCM.', true)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  title_template = excluded.title_template,
  body_template = excluded.body_template,
  requires_review = excluded.requires_review,
  is_active = true,
  updated_at = now();

create or replace function private.phase_four_target_view(category_name text)
returns text language sql immutable set search_path = '' as $$
  select case category_name
    when 'contract' then 'contracts'
    when 'admission' then 'admissions'
    when 'document' then 'documents'
    when 'task' then 'tasks'
    when 'accounting' then 'accounting'
    when 'termination' then 'terminations'
    when 'leave' then 'leaves'
    when 'vacancy' then 'vacancies'
    when 'recruitment' then 'vacancies'
    when 'finance' then 'finance'
    when 'academic' then 'courses'
    else 'overview'
  end;
$$;
revoke all on function private.phase_four_target_view(text) from public, anon, authenticated;

create or replace function private.phase_four_recipient(alert_record public.operational_alerts)
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare
  direct_recipient text;
  desired_department text;
  selected_id uuid;
begin
  direct_recipient := coalesce(alert_record.metadata ->> 'assigned_to', alert_record.metadata ->> 'responsible_id');
  if direct_recipient ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select profile.id into selected_id from public.profiles profile
    where profile.id = direct_recipient::uuid and profile.role = 'cafcm_admin' and profile.is_active;
    if selected_id is not null then return selected_id; end if;
  end if;

  desired_department := case alert_record.category
    when 'finance' then 'finance'
    when 'accounting' then 'finance'
    when 'academic' then 'coordination'
    when 'vacancy' then 'vacancies'
    when 'recruitment' then 'vacancies'
    when 'contract' then 'personnel'
    when 'admission' then 'personnel'
    when 'document' then 'personnel'
    when 'termination' then 'personnel'
    when 'leave' then 'personnel'
    else 'management'
  end;

  select profile.id into selected_id
  from public.profiles profile
  where profile.role = 'cafcm_admin' and profile.is_active
    and profile.department in (desired_department, 'management')
  order by case when profile.department = desired_department then 0 else 1 end, profile.created_at
  limit 1;
  return selected_id;
end;
$$;
revoke all on function private.phase_four_recipient(public.operational_alerts) from public, anon, authenticated;

create or replace function private.refresh_phase_four_alerts()
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform private.refresh_operational_alerts();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'document-requirement:'||requirement.id::text,'document_requirement',requirement.id::text,'document',
    case when requirement.due_date < current_date then 'urgent' else 'attention' end,
    case when requirement.due_date < current_date then 'Documento pendente com prazo vencido' else 'Documento pendente próximo do prazo' end,
    concat(requirement.title,' · ',coalesce(person.full_name,company.name,'cadastro vinculado'),' · prazo ',to_char(requirement.due_date,'DD/MM/YYYY'),'.'),
    requirement.due_date,'active',null,now(),
    jsonb_strip_nulls(jsonb_build_object('apprentice_id',requirement.apprentice_id,'company_id',requirement.company_id,'responsible_id',requirement.responsible_id))
  from public.document_requirements requirement
  left join public.profiles person on person.id=requirement.apprentice_id
  left join public.companies company on company.id=requirement.company_id
  where requirement.status='pending' and requirement.due_date is not null and requirement.due_date<=current_date+7
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'document-expiry:'||document.id::text,'document',document.id::text,'document',
    case when document.expires_on<current_date then 'urgent' else 'attention' end,
    case when document.expires_on<current_date then 'Documento vencido' else 'Documento próximo do vencimento' end,
    concat(document.title,' · validade ',to_char(document.expires_on,'DD/MM/YYYY'),'.'),document.expires_on,'active',null,now(),
    jsonb_strip_nulls(jsonb_build_object('apprentice_id',document.apprentice_id,'company_id',document.company_id))
  from public.document_records document
  where not document.is_archived and document.expires_on is not null and document.expires_on<=current_date+30
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'financial-charge:'||charge.id::text,'financial_charge',charge.id::text,'finance',
    case when charge.due_date<current_date then 'urgent' else 'attention' end,
    case when charge.due_date<current_date then 'Cobrança vencida para conferência' else 'Cobrança próxima do vencimento' end,
    concat(company.name,' · ',charge.description,' · ',to_char(charge.due_date,'DD/MM/YYYY'),' · R$ ',to_char(charge.amount,'FM999G999G990D00'),'.'),
    charge.due_date,'active',null,now(),jsonb_build_object('company_id',charge.company_id,'responsible_id',charge.responsible_id,'status',charge.status)
  from public.financial_charges charge join public.companies company on company.id=charge.company_id
  where charge.status not in ('paid','cancelled') and charge.due_date is not null and charge.due_date<=current_date+7
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'recruitment-stalled:'||application.id::text,'vacancy_application',application.id::text,'recruitment',
    case when application.updated_at<now()-interval '7 days' then 'urgent' else 'attention' end,
    'Seleção aguardando atualização',concat(candidate.full_name,' · ',vacancy.title,' · sem atualização há ',floor(extract(epoch from now()-application.updated_at)/86400),' dias.'),
    application.updated_at::date,'active',null,now(),jsonb_build_object('company_id',vacancy.company_id,'candidate_id',application.candidate_id,'status',application.status)
  from public.vacancy_applications application
  join public.candidates candidate on candidate.id=application.candidate_id
  join public.job_vacancies vacancy on vacancy.id=application.vacancy_id
  where application.status not in ('approved','talent_pool','rejected','withdrawn','hired') and application.updated_at<now()-interval '3 days'
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'termination-date:'||termination.id::text,'termination',termination.id::text,'termination',
    case when termination.effective_date<current_date then 'urgent' else 'attention' end,
    case when termination.effective_date<current_date then 'Desligamento passou da data prevista' else 'Data de desligamento próxima' end,
    concat(person.full_name,' · data prevista ',to_char(termination.effective_date,'DD/MM/YYYY'),' · etapa ',termination.status,'.'),termination.effective_date,'active',null,now(),
    jsonb_build_object('apprentice_id',termination.apprentice_id,'company_id',termination.company_id,'status',termination.status)
  from public.termination_cases termination join public.profiles person on person.id=termination.apprentice_id
  where termination.status not in ('completed','cancelled') and termination.effective_date is not null and termination.effective_date<=current_date+7
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'leave-date:'||leave_record.id::text,'leave',leave_record.id::text,'leave',
    case when (leave_record.status in ('planned','approved') and leave_record.start_date<current_date) or (leave_record.status='in_progress' and leave_record.end_date<current_date) then 'urgent' else 'attention' end,
    case when leave_record.status='in_progress' then 'Retorno de afastamento requer conferência' else 'Férias ou afastamento próximo' end,
    concat(person.full_name,' · ',to_char(leave_record.start_date,'DD/MM/YYYY'),' a ',to_char(leave_record.end_date,'DD/MM/YYYY'),' · etapa ',leave_record.status,'.'),
    case when leave_record.status='in_progress' then leave_record.end_date else leave_record.start_date end,'active',null,now(),
    jsonb_build_object('apprentice_id',leave_record.apprentice_id,'company_id',leave_record.company_id,'status',leave_record.status)
  from public.leave_records leave_record join public.profiles person on person.id=leave_record.apprentice_id
  where (leave_record.status in ('planned','approved') and leave_record.start_date<=current_date+7)
     or (leave_record.status='in_progress' and leave_record.end_date<=current_date+3)
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'academic-overdue:'||activity.id::text||':'||enrollment.apprentice_id::text,'activity',activity.id::text,'academic','attention',
    'Atividade vencida sem envio',concat(person.full_name,' ainda não enviou ',activity.title,'; prazo ',to_char(activity.due_at at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI'),'.'),
    activity.due_at::date,'active',null,now(),jsonb_build_object('apprentice_id',enrollment.apprentice_id,'course_id',activity.course_id)
  from public.activities activity
  join public.enrollments enrollment on enrollment.course_id=activity.course_id
  join public.profiles person on person.id=enrollment.apprentice_id and person.is_active
  left join public.activity_attempts attempt on attempt.activity_id=activity.id and attempt.apprentice_id=enrollment.apprentice_id
  where activity.due_at is not null and activity.due_at<now() and attempt.activity_id is null
  on conflict(alert_key) do update set message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();
end;
$$;
revoke all on function private.refresh_phase_four_alerts() from public, anon, authenticated;

create or replace function private.sync_phase_four_work()
returns void language plpgsql security definer set search_path = '' as $$
declare alert_record public.operational_alerts%rowtype; recipient uuid; target text;
begin
  for alert_record in select alert.* from public.operational_alerts alert where alert.status='active'
  loop
    recipient := private.phase_four_recipient(alert_record);
    target := private.phase_four_target_view(alert_record.category);
    if recipient is not null then
      insert into public.notifications(recipient_id,kind,title,message,entity_type,entity_id,is_read,read_at,source_alert_id,automation_key,status,priority,due_at,target_view,resolved_at)
      values(recipient,alert_record.severity,alert_record.title,alert_record.message,alert_record.source_type,alert_record.source_id,false,null,alert_record.id,'alert:'||alert_record.alert_key,'open',
        case alert_record.severity when 'urgent' then 'urgent' when 'attention' then 'high' else 'normal' end,
        case when alert_record.due_on is null then null else (alert_record.due_on::timestamp+time '12:00') at time zone 'America/Sao_Paulo' end,target,null)
      on conflict(automation_key) where automation_key is not null do update set
        recipient_id=excluded.recipient_id,kind=excluded.kind,title=excluded.title,message=excluded.message,entity_type=excluded.entity_type,entity_id=excluded.entity_id,
        source_alert_id=excluded.source_alert_id,status=case when public.notifications.status='dismissed' then 'dismissed' else 'open' end,
        priority=excluded.priority,due_at=excluded.due_at,target_view=excluded.target_view,resolved_at=null,updated_at=now();

      if alert_record.severity in ('attention','urgent') and alert_record.category<>'task' then
        insert into public.tasks(title,description,status,priority,category,company_id,apprentice_id,assigned_to,due_at,automation_key)
        values(alert_record.title,alert_record.message,'pending',case when alert_record.severity='urgent' then 'urgent' else 'high' end,'Automação · '||initcap(alert_record.category),
          case when alert_record.metadata->>'company_id' ~* '^[0-9a-f-]{36}$' then (alert_record.metadata->>'company_id')::uuid else null end,
          case when alert_record.metadata->>'apprentice_id' ~* '^[0-9a-f-]{36}$' then (alert_record.metadata->>'apprentice_id')::uuid else null end,
          recipient,case when alert_record.due_on is null then null else (alert_record.due_on::timestamp+time '12:00') at time zone 'America/Sao_Paulo' end,'alert:'||alert_record.alert_key)
        on conflict(automation_key) where automation_key is not null do update set
          title=excluded.title,description=excluded.description,priority=excluded.priority,category=excluded.category,company_id=excluded.company_id,
          apprentice_id=excluded.apprentice_id,assigned_to=excluded.assigned_to,due_at=excluded.due_at,updated_at=now();
      end if;
    end if;
  end loop;

  update public.notifications notification set status='resolved',resolved_at=now(),updated_at=now()
  where notification.automation_key like 'alert:%' and notification.status='open'
    and not exists(select 1 from public.operational_alerts alert where 'alert:'||alert.alert_key=notification.automation_key and alert.status='active');

  update public.tasks task set status='completed',completed_at=coalesce(task.completed_at,now()),updated_at=now()
  where task.automation_key like 'alert:%' and task.status in ('pending','in_progress','waiting')
    and not exists(select 1 from public.operational_alerts alert where 'alert:'||alert.alert_key=task.automation_key and alert.status='active');
end;
$$;
revoke all on function private.sync_phase_four_work() from public, anon, authenticated;

create or replace function private.run_phase_four_automations(run_source_value text, actor_id uuid default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare run_id uuid; active_alerts integer; open_notifications integer; open_tasks integer;
begin
  insert into public.automation_runs(run_source,status,executed_by) values(run_source_value,'running',actor_id) returning id into run_id;
  perform private.refresh_phase_four_alerts();
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

create or replace function public.run_portal_automations()
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not (select private.has_portal_permission('operations.manage')) then
    raise exception 'Acesso não autorizado.' using errcode='42501';
  end if;
  return private.run_phase_four_automations('manual',(select auth.uid()));
end;
$$;
revoke all on function public.run_portal_automations() from public, anon;
grant execute on function public.run_portal_automations() to authenticated;

alter table public.automation_runs enable row level security;
alter table public.document_templates enable row level security;
alter table public.document_generations enable row level security;
alter table public.banking_integrations enable row level security;
alter table public.bank_file_batches enable row level security;

revoke all on table public.automation_runs, public.document_templates, public.document_generations, public.banking_integrations, public.bank_file_batches from public, anon;
grant select on table public.automation_runs to authenticated;
grant select,insert,update,delete on table public.document_templates,public.document_generations,public.banking_integrations,public.bank_file_batches to authenticated;
grant all on table public.automation_runs,public.document_templates,public.document_generations,public.banking_integrations,public.bank_file_batches to service_role;

create policy automation_runs_cafcm_select on public.automation_runs for select to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('operations.read')));

create policy document_templates_cafcm_select on public.document_templates for select to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.read')));
create policy document_templates_cafcm_write on public.document_templates for all to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));

create policy document_generations_cafcm_select on public.document_generations for select to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.read')));
create policy document_generations_cafcm_write on public.document_generations for all to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('documents.manage')));

create policy banking_integrations_cafcm_select on public.banking_integrations for select to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.read')));
create policy banking_integrations_cafcm_write on public.banking_integrations for all to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));
create policy bank_file_batches_cafcm_select on public.bank_file_batches for select to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.read')));
create policy bank_file_batches_cafcm_write on public.bank_file_batches for all to authenticated
using ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')))
with check ((select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('finance.manage')));

-- Notification recipients can only change their own read/open state. Automation
-- content is written by trusted database functions.
revoke insert,delete on table public.notifications from authenticated;
revoke update on table public.notifications from authenticated;
grant update(is_read,read_at,status,resolved_at,updated_at) on table public.notifications to authenticated;

do $$ declare existing_job bigint;
begin
  for existing_job in select jobid from cron.job where jobname='cafcm-refresh-operational-alerts'
  loop perform cron.unschedule(existing_job); end loop;
end $$;
select cron.schedule('cafcm-refresh-operational-alerts','15 * * * *',$$select private.run_phase_four_automations('schedule',null)$$);

select private.run_phase_four_automations('system',null);

commit;
