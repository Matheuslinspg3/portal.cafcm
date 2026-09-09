begin;

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(trim(name)) between 2 and 120),
  description text not null default '' check (char_length(description) <= 1000),
  color text not null default '#0968e8' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null default 1 check (position > 0),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(trim(name)) between 2 and 120),
  color text not null default '#dceaff' check (color ~ '^#[0-9A-Fa-f]{6}$'),
  position integer not null check (position > 0),
  is_terminal boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pipeline_stages_pipeline_slug_key unique (pipeline_id, slug),
  constraint pipeline_stages_pipeline_position_key unique (pipeline_id, position),
  constraint pipeline_stages_pipeline_id_id_key unique (pipeline_id, id)
);

create table public.pipeline_items (
  id uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete restrict,
  stage_id uuid not null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 12000),
  company_id uuid references public.companies(id) on delete set null,
  apprentice_id uuid references public.profiles(id) on delete set null,
  responsible_id uuid references public.profiles(id) on delete set null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  due_at timestamptz,
  position integer not null default 1000 check (position >= 0),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  last_moved_at timestamptz not null default now(),
  closed_at timestamptz,
  is_archived boolean not null default false,
  archived_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pipeline_items_stage_pipeline_fkey
    foreign key (pipeline_id, stage_id)
    references public.pipeline_stages(pipeline_id, id)
    on delete restrict,
  constraint pipeline_items_archive_consistency_check check (
    (is_archived and archived_at is not null)
    or (not is_archived and archived_at is null)
  )
);

create table public.pipeline_item_movements (
  id bigint generated always as identity primary key,
  pipeline_item_id uuid not null references public.pipeline_items(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete restrict,
  from_stage_id uuid references public.pipeline_stages(id) on delete set null,
  to_stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  moved_by uuid references public.profiles(id) on delete set null,
  moved_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 12000),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'waiting', 'completed', 'cancelled')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  category text not null default '' check (char_length(category) <= 100),
  company_id uuid references public.companies(id) on delete set null,
  apprentice_id uuid references public.profiles(id) on delete set null,
  pipeline_item_id uuid references public.pipeline_items(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  position integer not null check (position > 0),
  is_completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_checklist_items_task_position_key unique (task_id, position),
  constraint task_checklist_completion_consistency_check check (
    (is_completed and completed_at is not null)
    or (not is_completed and completed_at is null and completed_by is null)
  )
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null default 'information' check (kind in ('information', 'task', 'attention', 'urgent')),
  title text not null check (char_length(trim(title)) between 2 and 160),
  message text not null default '' check (char_length(message) <= 1000),
  entity_type text not null default '' check (char_length(entity_type) <= 80),
  entity_id text not null default '' check (char_length(entity_id) <= 120),
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_read_consistency_check check (
    (is_read and read_at is not null)
    or (not is_read and read_at is null)
  )
);

create index pipelines_active_position_idx on public.pipelines(is_active, position);
create index pipeline_stages_pipeline_active_position_idx on public.pipeline_stages(pipeline_id, is_active, position);
create index pipeline_items_pipeline_stage_position_idx on public.pipeline_items(pipeline_id, stage_id, position);
create index pipeline_items_company_id_idx on public.pipeline_items(company_id) where company_id is not null;
create index pipeline_items_apprentice_id_idx on public.pipeline_items(apprentice_id) where apprentice_id is not null;
create index pipeline_items_responsible_id_idx on public.pipeline_items(responsible_id) where responsible_id is not null;
create index pipeline_items_due_at_idx on public.pipeline_items(due_at) where due_at is not null and not is_archived;
create index pipeline_items_last_moved_at_idx on public.pipeline_items(last_moved_at desc) where not is_archived;
create index pipeline_item_movements_item_moved_at_idx on public.pipeline_item_movements(pipeline_item_id, moved_at desc);
create index pipeline_item_movements_moved_by_idx on public.pipeline_item_movements(moved_by) where moved_by is not null;
create index tasks_status_due_at_idx on public.tasks(status, due_at) where status not in ('completed', 'cancelled');
create index tasks_assigned_to_status_idx on public.tasks(assigned_to, status) where assigned_to is not null;
create index tasks_company_id_idx on public.tasks(company_id) where company_id is not null;
create index tasks_apprentice_id_idx on public.tasks(apprentice_id) where apprentice_id is not null;
create index tasks_pipeline_item_id_idx on public.tasks(pipeline_item_id) where pipeline_item_id is not null;
create index tasks_created_by_idx on public.tasks(created_by) where created_by is not null;
create index task_checklist_items_completed_by_idx on public.task_checklist_items(completed_by) where completed_by is not null;
create index notifications_recipient_unread_idx on public.notifications(recipient_id, created_at desc) where not is_read;
create index notifications_recipient_created_at_idx on public.notifications(recipient_id, created_at desc);

create trigger pipelines_updated_at
before update on public.pipelines
for each row execute function private.set_updated_at();

create trigger pipeline_stages_updated_at
before update on public.pipeline_stages
for each row execute function private.set_updated_at();

create trigger pipeline_items_updated_at
before update on public.pipeline_items
for each row execute function private.set_updated_at();

create trigger tasks_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();

create trigger task_checklist_items_updated_at
before update on public.task_checklist_items
for each row execute function private.set_updated_at();

create function private.sync_pipeline_item_state()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  destination_is_terminal boolean;
begin
  select stage.is_terminal
    into destination_is_terminal
  from public.pipeline_stages stage
  where stage.id = new.stage_id
    and stage.pipeline_id = new.pipeline_id;

  if destination_is_terminal is null then
    raise exception 'A etapa selecionada não pertence a esta esteira.';
  end if;

  if tg_op = 'INSERT' or old.stage_id is distinct from new.stage_id then
    new.last_moved_at := now();
    new.closed_at := case when destination_is_terminal then coalesce(new.closed_at, now()) else null end;
  end if;

  if new.is_archived and new.archived_at is null then
    new.archived_at := now();
  elsif not new.is_archived then
    new.archived_at := null;
  end if;

  return new;
end;
$$;

create trigger pipeline_items_sync_state
before insert or update on public.pipeline_items
for each row execute function private.sync_pipeline_item_state();

create function private.capture_pipeline_item_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.stage_id is distinct from new.stage_id then
    insert into public.pipeline_item_movements (
      pipeline_item_id,
      pipeline_id,
      from_stage_id,
      to_stage_id,
      moved_by,
      moved_at
    ) values (
      new.id,
      new.pipeline_id,
      old.stage_id,
      new.stage_id,
      (select auth.uid()),
      new.last_moved_at
    );
  end if;
  return new;
end;
$$;

revoke all on function private.capture_pipeline_item_movement() from public, anon, authenticated;

create trigger pipeline_items_capture_movement
after update of stage_id on public.pipeline_items
for each row execute function private.capture_pipeline_item_movement();

create function private.sync_task_completion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger tasks_sync_completion
before insert or update of status on public.tasks
for each row execute function private.sync_task_completion();

create function private.sync_task_checklist_completion()
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

create trigger task_checklist_items_sync_completion
before insert or update of is_completed on public.task_checklist_items
for each row execute function private.sync_task_checklist_completion();

create function private.notify_task_assignment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is not null
     and new.assigned_to is not null
     and (tg_op = 'INSERT' or old.assigned_to is distinct from new.assigned_to) then
    insert into public.notifications (
      recipient_id,
      kind,
      title,
      message,
      entity_type,
      entity_id
    ) values (
      new.assigned_to,
      'task',
      'Tarefa atribuída',
      new.title,
      'task',
      new.id::text
    );
  end if;
  return new;
end;
$$;

revoke all on function private.notify_task_assignment() from public, anon, authenticated;

create trigger tasks_notify_assignment
after insert or update of assigned_to on public.tasks
for each row execute function private.notify_task_assignment();

create or replace function private.capture_portal_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  old_data jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  new_data jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  record_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  subject_id uuid;
  record_id text;
  changed_fields jsonb := '[]'::jsonb;
  audit_details jsonb;
begin
  if actor is null then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' then
    select coalesce(jsonb_agg(field order by field), '[]'::jsonb)
      into changed_fields
    from jsonb_object_keys(new_data) as fields(field)
    where field not in ('updated_at')
      and new_data -> field is distinct from old_data -> field;
  end if;

  subject_id := case
    when tg_table_name = 'profiles' then nullif(record_data ->> 'id', '')::uuid
    when tg_table_name in ('enrollments', 'lesson_progress', 'activity_attempts', 'activity_responses', 'pipeline_items', 'tasks')
      then nullif(record_data ->> 'apprentice_id', '')::uuid
    else null
  end;

  record_id := coalesce(
    nullif(record_data ->> 'id', ''),
    concat_ws(':',
      nullif(record_data ->> 'course_id', ''),
      nullif(record_data ->> 'lesson_id', ''),
      nullif(record_data ->> 'activity_id', ''),
      nullif(record_data ->> 'apprentice_id', '')
    )
  );

  audit_details := jsonb_strip_nulls(jsonb_build_object(
    'label', coalesce(
      nullif(record_data ->> 'title', ''),
      nullif(record_data ->> 'full_name', ''),
      nullif(record_data ->> 'name', ''),
      nullif(record_data ->> 'email', '')
    ),
    'status', nullif(record_data ->> 'status', ''),
    'priority', nullif(record_data ->> 'priority', ''),
    'block_type', nullif(record_data ->> 'block_type', ''),
    'course_id', nullif(record_data ->> 'course_id', ''),
    'lesson_id', nullif(record_data ->> 'lesson_id', ''),
    'activity_id', nullif(record_data ->> 'activity_id', ''),
    'pipeline_id', nullif(record_data ->> 'pipeline_id', ''),
    'stage_id', nullif(record_data ->> 'stage_id', ''),
    'task_id', nullif(record_data ->> 'task_id', ''),
    'company_id', nullif(record_data ->> 'company_id', ''),
    'apprentice_id', nullif(record_data ->> 'apprentice_id', ''),
    'assigned_to', nullif(record_data ->> 'assigned_to', ''),
    'responsible_id', nullif(record_data ->> 'responsible_id', ''),
    'due_at', nullif(record_data ->> 'due_at', ''),
    'changed_fields', case when tg_op = 'UPDATE' then changed_fields else null end
  ));

  insert into public.audit_logs (
    actor_id,
    subject_user_id,
    action,
    entity_type,
    entity_id,
    details
  ) values (
    actor,
    subject_id,
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    coalesce(record_id, ''),
    audit_details
  );

  return coalesce(new, old);
end;
$$;

revoke all on function private.capture_portal_audit() from public, anon, authenticated;

create trigger pipelines_capture_audit
after insert or update or delete on public.pipelines
for each row execute function private.capture_portal_audit();

create trigger pipeline_stages_capture_audit
after insert or update or delete on public.pipeline_stages
for each row execute function private.capture_portal_audit();

create trigger pipeline_items_capture_audit
after insert or update or delete on public.pipeline_items
for each row execute function private.capture_portal_audit();

create trigger tasks_capture_audit
after insert or update or delete on public.tasks
for each row execute function private.capture_portal_audit();

create trigger task_checklist_items_capture_audit
after insert or update or delete on public.task_checklist_items
for each row execute function private.capture_portal_audit();

alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.pipeline_items enable row level security;
alter table public.pipeline_item_movements enable row level security;
alter table public.tasks enable row level security;
alter table public.task_checklist_items enable row level security;
alter table public.notifications enable row level security;

create policy pipelines_admin_select on public.pipelines
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipelines_admin_insert on public.pipelines
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipelines_admin_update on public.pipelines
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipeline_stages_admin_select on public.pipeline_stages
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipeline_stages_admin_insert on public.pipeline_stages
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipeline_stages_admin_update on public.pipeline_stages
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipeline_items_admin_select on public.pipeline_items
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipeline_items_admin_insert on public.pipeline_items
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipeline_items_admin_update on public.pipeline_items
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy pipeline_item_movements_admin_select on public.pipeline_item_movements
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

create policy tasks_admin_select on public.tasks
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

create policy tasks_admin_insert on public.tasks
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy tasks_admin_update on public.tasks
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy task_checklist_items_admin_select on public.task_checklist_items
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

create policy task_checklist_items_admin_insert on public.task_checklist_items
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy task_checklist_items_admin_update on public.task_checklist_items
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy task_checklist_items_admin_delete on public.task_checklist_items
for delete to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

create policy notifications_select_own on public.notifications
for select to authenticated
using (recipient_id = (select auth.uid()));

create policy notifications_update_own on public.notifications
for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

revoke all on public.pipelines from public, anon, authenticated;
revoke all on public.pipeline_stages from public, anon, authenticated;
revoke all on public.pipeline_items from public, anon, authenticated;
revoke all on public.pipeline_item_movements from public, anon, authenticated;
revoke all on public.tasks from public, anon, authenticated;
revoke all on public.task_checklist_items from public, anon, authenticated;
revoke all on public.notifications from public, anon, authenticated;

grant select, insert, update on public.pipelines to authenticated;
grant select, insert, update on public.pipeline_stages to authenticated;
grant select, insert, update on public.pipeline_items to authenticated;
grant select on public.pipeline_item_movements to authenticated;
grant select, insert, update on public.tasks to authenticated;
grant select, insert, update, delete on public.task_checklist_items to authenticated;
grant select on public.notifications to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;

grant all on public.pipelines to service_role;
grant all on public.pipeline_stages to service_role;
grant all on public.pipeline_items to service_role;
grant all on public.pipeline_item_movements to service_role;
grant all on public.tasks to service_role;
grant all on public.task_checklist_items to service_role;
grant all on public.notifications to service_role;
grant usage, select on sequence public.pipeline_item_movements_id_seq to service_role;

insert into public.pipelines (slug, name, description, color, position)
values
  ('commercial', 'Empresas / Comercial', 'Prospecção, negociação de convênios e ativação de empresas parceiras.', '#0968e8', 10),
  ('recruitment', 'Recrutamento', 'Triagem e acompanhamento de candidatos até a decisão final.', '#7c3aed', 20),
  ('admissions', 'Admissões', 'Documentação e providências necessárias para concluir cada admissão.', '#0f9f74', 30),
  ('contracts', 'Contratos', 'Acompanhamento do ciclo e dos vencimentos dos contratos de aprendizagem.', '#2563eb', 40),
  ('terminations', 'Desligamentos', 'Coordenação das etapas de desligamento com preservação do histórico.', '#c2414c', 50),
  ('finance', 'Financeiro', 'Controle operacional de faturamento, cobrança e recebimento.', '#b75b0a', 60),
  ('personnel', 'Departamento Pessoal', 'Controle de pendências e retornos das rotinas de departamento pessoal.', '#475569', 70)
on conflict (slug) do nothing;

insert into public.pipeline_stages (pipeline_id, slug, name, color, position, is_terminal)
select pipeline.id, stage.slug, stage.name, stage.color, stage.position, stage.is_terminal
from public.pipelines pipeline
join (values
  ('commercial', 'new-contact', 'Novo contato', '#dbeafe', 10, false),
  ('commercial', 'contact-made', 'Contato realizado', '#dbeafe', 20, false),
  ('commercial', 'meeting', 'Reunião / apresentação', '#e0e7ff', 30, false),
  ('commercial', 'proposal-sent', 'Proposta enviada', '#ede9fe', 40, false),
  ('commercial', 'waiting-return', 'Aguardando retorno', '#fef3c7', 50, false),
  ('commercial', 'negotiation', 'Negociação', '#ffedd5', 60, false),
  ('commercial', 'agreement-drafting', 'Convênio em elaboração', '#cffafe', 70, false),
  ('commercial', 'agreement-signed', 'Convênio assinado', '#ccfbf1', 80, false),
  ('commercial', 'active-company', 'Empresa ativa', '#dcfce7', 90, true),
  ('commercial', 'lost', 'Perdida', '#fee2e2', 100, true),
  ('commercial', 'not-interested', 'Sem interesse', '#f1f5f9', 110, true),
  ('commercial', 'future-contact', 'Contato futuro', '#e0f2fe', 120, false),
  ('recruitment', 'candidate-received', 'Candidato recebido', '#dbeafe', 10, false),
  ('recruitment', 'screening', 'Triagem', '#e0e7ff', 20, false),
  ('recruitment', 'cafcm-interview', 'Entrevista CAFCM', '#ede9fe', 30, false),
  ('recruitment', 'referred-company', 'Encaminhado à empresa', '#cffafe', 40, false),
  ('recruitment', 'company-interview', 'Entrevista empresa', '#ccfbf1', 50, false),
  ('recruitment', 'waiting-return', 'Aguardando retorno', '#fef3c7', 60, false),
  ('recruitment', 'approved', 'Aprovado', '#dcfce7', 70, true),
  ('recruitment', 'talent-pool', 'Banco de talentos', '#e0f2fe', 80, false),
  ('recruitment', 'not-approved', 'Não aprovado', '#fee2e2', 90, true),
  ('recruitment', 'withdrawn', 'Desistente', '#f1f5f9', 100, true),
  ('admissions', 'approved', 'Aprovado', '#dbeafe', 10, false),
  ('admissions', 'documents-pending', 'Documentos pendentes', '#fef3c7', 20, false),
  ('admissions', 'documents-complete', 'Documentos completos', '#e0e7ff', 30, false),
  ('admissions', 'medical-exam', 'Exame admissional', '#ede9fe', 40, false),
  ('admissions', 'contract-drafting', 'Contrato em elaboração', '#cffafe', 50, false),
  ('admissions', 'waiting-signatures', 'Aguardando assinaturas', '#ffedd5', 60, false),
  ('admissions', 'accounting-esocial', 'Contabilidade / eSocial', '#dbeafe', 70, false),
  ('admissions', 'enrollment-course', 'Matrícula / curso', '#ccfbf1', 80, false),
  ('admissions', 'completed', 'Admissão concluída', '#dcfce7', 90, true),
  ('contracts', 'to-start', 'A iniciar', '#dbeafe', 10, false),
  ('contracts', 'active', 'Ativo', '#dcfce7', 20, false),
  ('contracts', 'expires-90', 'Vencimento em 90 dias', '#e0f2fe', 30, false),
  ('contracts', 'expires-60', 'Vencimento em 60 dias', '#fef3c7', 40, false),
  ('contracts', 'expires-30', 'Vencimento em 30 dias', '#ffedd5', 50, false),
  ('contracts', 'expires-15', 'Vencimento em 15 dias', '#fee2e2', 60, false),
  ('contracts', 'closing', 'Encerramento', '#ede9fe', 70, false),
  ('contracts', 'closed', 'Encerrado', '#f1f5f9', 80, true),
  ('terminations', 'request', 'Solicitação', '#dbeafe', 10, false),
  ('terminations', 'analysis', 'Análise', '#e0e7ff', 20, false),
  ('terminations', 'medical-exam', 'Exame demissional', '#ede9fe', 30, false),
  ('terminations', 'documentation', 'Documentação', '#cffafe', 40, false),
  ('terminations', 'accounting', 'Contabilidade', '#fef3c7', 50, false),
  ('terminations', 'termination-payment', 'Rescisão', '#ffedd5', 60, false),
  ('terminations', 'finance', 'Financeiro', '#fee2e2', 70, false),
  ('terminations', 'documents-delivered', 'Documentos entregues', '#ccfbf1', 80, false),
  ('terminations', 'completed', 'Concluído', '#dcfce7', 90, true),
  ('finance', 'to-invoice', 'A faturar', '#dbeafe', 10, false),
  ('finance', 'invoice-issued', 'NF emitida', '#e0e7ff', 20, false),
  ('finance', 'payment-slip-issued', 'Boleto emitido', '#ede9fe', 30, false),
  ('finance', 'sent', 'Enviado', '#cffafe', 40, false),
  ('finance', 'to-due', 'A vencer', '#fef3c7', 50, false),
  ('finance', 'overdue', 'Vencido', '#fee2e2', 60, false),
  ('finance', 'collection', 'Em cobrança', '#ffedd5', 70, false),
  ('finance', 'paid', 'Pago', '#dcfce7', 80, true),
  ('personnel', 'pending', 'Pendente', '#fee2e2', 10, false),
  ('personnel', 'preparing', 'Em preparação', '#ffedd5', 20, false),
  ('personnel', 'sent-accounting', 'Enviado à contabilidade', '#dbeafe', 30, false),
  ('personnel', 'waiting-return', 'Aguardando retorno', '#fef3c7', 40, false),
  ('personnel', 'received', 'Recebido', '#e0e7ff', 50, false),
  ('personnel', 'checked', 'Conferido', '#ccfbf1', 60, false),
  ('personnel', 'completed', 'Concluído', '#dcfce7', 70, true)
) as stage(pipeline_slug, slug, name, color, position, is_terminal)
  on stage.pipeline_slug = pipeline.slug
on conflict (pipeline_id, slug) do nothing;

commit;
