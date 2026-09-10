begin;

-- Phase 2: connect recruitment, admissions, contracts and terminations into one operation.

alter table public.candidates
  add column if not exists birth_date date,
  add column if not exists education_level text not null default '',
  add column if not exists neighborhood text not null default '',
  add column if not exists source text not null default '',
  add column if not exists archived_at timestamptz;

alter table public.candidates drop constraint if exists candidates_status_check;
alter table public.candidates add constraint candidates_status_check check (
  status in ('new','screening','interview','approved','rejected','hired','archived')
);

alter table public.job_vacancies
  add column if not exists work_model text not null default '',
  add column if not exists location text not null default '',
  add column if not exists monthly_salary numeric(12,2),
  add column if not exists notes text not null default '',
  add column if not exists closed_at timestamptz;

alter table public.job_vacancies
  add constraint job_vacancies_monthly_salary_check check (monthly_salary is null or monthly_salary >= 0),
  add constraint job_vacancies_notes_check check (char_length(notes) <= 12000);

alter table public.vacancy_applications
  add column if not exists pipeline_item_id uuid unique references public.pipeline_items(id) on delete set null,
  add column if not exists company_interview_at timestamptz,
  add column if not exists forwarded_at timestamptz,
  add column if not exists approved_at timestamptz,
  add column if not exists company_feedback text not null default '',
  add column if not exists created_by uuid references public.profiles(id) on delete set null default auth.uid();

alter table public.vacancy_applications drop constraint if exists vacancy_applications_status_check;
update public.vacancy_applications set status = case status
  when 'applied' then 'received'
  when 'interview' then 'cafcm_interview'
  when 'referred' then 'referred_company'
  else status
end;

alter table public.vacancy_applications add constraint vacancy_applications_status_check check (
  status in ('received','screening','cafcm_interview','referred_company','company_interview','waiting_return','approved','talent_pool','rejected','withdrawn','hired')
);
alter table public.vacancy_applications
  add constraint vacancy_applications_feedback_check check (char_length(company_feedback) <= 12000);

alter table public.admission_cases
  add column if not exists candidate_id uuid references public.candidates(id) on delete set null,
  add column if not exists application_id uuid unique references public.vacancy_applications(id) on delete set null;

create table public.candidate_documents (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 180),
  category text not null default 'resume' check (category in ('resume','identification','school','certificate','other')),
  storage_path text not null unique check (char_length(storage_path) between 3 and 1024),
  mime_type text not null default '' check (char_length(mime_type) <= 180),
  file_size bigint check (file_size is null or file_size >= 0),
  uploaded_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruitment_events (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  application_id uuid references public.vacancy_applications(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 2 and 80),
  from_status text,
  to_status text,
  notes text not null default '' check (char_length(notes) <= 12000),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

create index if not exists candidates_name_search_idx on public.candidates using gin (to_tsvector('simple', full_name || ' ' || coalesce(email, '') || ' ' || coalesce(cpf, '')));
create index if not exists candidates_created_at_idx on public.candidates(created_at desc);
create index if not exists job_vacancies_status_due_idx on public.job_vacancies(status, due_date);
create index if not exists vacancy_applications_candidate_status_idx on public.vacancy_applications(candidate_id, status);
create index if not exists admission_cases_candidate_idx on public.admission_cases(candidate_id) where candidate_id is not null;
create index if not exists candidate_documents_candidate_created_idx on public.candidate_documents(candidate_id, created_at desc);
create index if not exists recruitment_events_candidate_created_idx on public.recruitment_events(candidate_id, created_at desc);
create index if not exists recruitment_events_application_created_idx on public.recruitment_events(application_id, created_at desc) where application_id is not null;
create unique index if not exists contracts_pipeline_item_unique_idx on public.contracts(pipeline_item_id) where pipeline_item_id is not null;

create trigger candidate_documents_updated_at before update on public.candidate_documents
for each row execute function private.set_updated_at();

create function private.stamp_recruitment_milestones()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status in ('referred_company','company_interview','waiting_return','approved','hired') then
    new.forwarded_at := coalesce(new.forwarded_at, now());
  end if;
  if new.status in ('approved','hired') then
    new.approved_at := coalesce(new.approved_at, now());
  end if;
  return new;
end; $$;
revoke all on function private.stamp_recruitment_milestones() from public, anon, authenticated;
create trigger vacancy_applications_stamp_milestones before insert or update of status on public.vacancy_applications
for each row execute function private.stamp_recruitment_milestones();

alter table public.candidate_documents enable row level security;
alter table public.recruitment_events enable row level security;

revoke all on table public.candidate_documents, public.recruitment_events from anon;
revoke all on table public.candidate_documents, public.recruitment_events from authenticated;
grant select, insert, update, delete on table public.candidate_documents to authenticated;
grant select on table public.recruitment_events to authenticated;

create policy candidate_documents_cafcm_admin_all on public.candidate_documents
for all to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy candidate_documents_department_select on public.candidate_documents
as restrictive for select to authenticated
using ((select private.has_portal_permission('vacancies.read')));
create policy candidate_documents_department_insert on public.candidate_documents
as restrictive for insert to authenticated
with check ((select private.has_portal_permission('vacancies.manage')));
create policy candidate_documents_department_update on public.candidate_documents
as restrictive for update to authenticated
using ((select private.has_portal_permission('vacancies.manage')))
with check ((select private.has_portal_permission('vacancies.manage')));
create policy candidate_documents_department_delete on public.candidate_documents
as restrictive for delete to authenticated
using ((select private.has_portal_permission('vacancies.manage')));

create policy recruitment_events_cafcm_admin_select on public.recruitment_events
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');
create policy recruitment_events_department_select on public.recruitment_events
as restrictive for select to authenticated
using ((select private.has_portal_permission('vacancies.read')));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'cafcm-recruitment', 'cafcm-recruitment', false, 26214400,
  array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy cafcm_recruitment_admin_select on storage.objects for select to authenticated
using (bucket_id = 'cafcm-recruitment' and (select private.current_portal_role()) = 'cafcm_admin');
create policy cafcm_recruitment_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'cafcm-recruitment' and (select private.current_portal_role()) = 'cafcm_admin');
create policy cafcm_recruitment_admin_update on storage.objects for update to authenticated
using (bucket_id = 'cafcm-recruitment' and (select private.current_portal_role()) = 'cafcm_admin')
with check (bucket_id = 'cafcm-recruitment' and (select private.current_portal_role()) = 'cafcm_admin');
create policy cafcm_recruitment_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'cafcm-recruitment' and (select private.current_portal_role()) = 'cafcm_admin');

create policy cafcm_recruitment_department_select on storage.objects
as restrictive for select to authenticated
using (bucket_id <> 'cafcm-recruitment' or (select private.has_portal_permission('vacancies.read')));
create policy cafcm_recruitment_department_insert on storage.objects
as restrictive for insert to authenticated
with check (bucket_id <> 'cafcm-recruitment' or (select private.has_portal_permission('vacancies.manage')));
create policy cafcm_recruitment_department_update on storage.objects
as restrictive for update to authenticated
using (bucket_id <> 'cafcm-recruitment' or (select private.has_portal_permission('vacancies.manage')))
with check (bucket_id <> 'cafcm-recruitment' or (select private.has_portal_permission('vacancies.manage')));
create policy cafcm_recruitment_department_delete on storage.objects
as restrictive for delete to authenticated
using (bucket_id <> 'cafcm-recruitment' or (select private.has_portal_permission('vacancies.manage')));

create function private.capture_recruitment_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
  candidate_uuid uuid;
begin
  if tg_table_name = 'candidates' then
  candidate_uuid := new.id;
    if tg_op = 'INSERT' then
      insert into public.recruitment_events (candidate_id, event_type, to_status, notes, created_by)
      values (candidate_uuid, 'candidate.created', new.status, 'Candidato incluído no banco de talentos.', actor);
    elsif new.status is distinct from old.status then
      insert into public.recruitment_events (candidate_id, event_type, from_status, to_status, notes, created_by)
      values (candidate_uuid, 'candidate.status_changed', old.status, new.status, 'Situação geral do candidato atualizada.', actor);
    else
      insert into public.recruitment_events (candidate_id, event_type, to_status, notes, created_by)
      values (candidate_uuid, 'candidate.updated', new.status, 'Dados cadastrais do candidato atualizados.', actor);
    end if;
  elsif tg_table_name = 'vacancy_applications' then
    candidate_uuid := coalesce(new.candidate_id, old.candidate_id);
    if tg_op = 'INSERT' then
      insert into public.recruitment_events (candidate_id, application_id, event_type, to_status, notes, details, created_by)
      values (candidate_uuid, new.id, 'application.created', new.status, coalesce(new.notes, ''), jsonb_build_object('vacancy_id', new.vacancy_id), actor);
    elsif new.status is distinct from old.status then
      insert into public.recruitment_events (candidate_id, application_id, event_type, from_status, to_status, notes, details, created_by)
      values (candidate_uuid, new.id, 'application.status_changed', old.status, new.status, coalesce(new.notes, ''), jsonb_build_object('vacancy_id', new.vacancy_id), actor);
    elsif new.notes is distinct from old.notes or new.company_feedback is distinct from old.company_feedback or new.company_interview_at is distinct from old.company_interview_at then
      insert into public.recruitment_events (candidate_id, application_id, event_type, to_status, notes, details, created_by)
      values (candidate_uuid, new.id, 'application.updated', new.status, coalesce(new.notes, ''), jsonb_build_object('vacancy_id', new.vacancy_id), actor);
    end if;
  end if;
  return coalesce(new, old);
end;
$$;
revoke all on function private.capture_recruitment_event() from public, anon, authenticated;

create trigger candidates_recruitment_event after insert or update on public.candidates
for each row execute function private.capture_recruitment_event();
create trigger vacancy_applications_recruitment_event after insert or update on public.vacancy_applications
for each row execute function private.capture_recruitment_event();

create trigger candidates_audit after insert or update or delete on public.candidates
for each row execute function private.capture_administrative_audit();
create trigger job_vacancies_audit after insert or update or delete on public.job_vacancies
for each row execute function private.capture_administrative_audit();
create trigger vacancy_applications_audit after insert or update or delete on public.vacancy_applications
for each row execute function private.capture_administrative_audit();
create trigger partnership_agreements_audit after insert or update or delete on public.partnership_agreements
for each row execute function private.capture_administrative_audit();
create trigger candidate_documents_audit after insert or update or delete on public.candidate_documents
for each row execute function private.capture_administrative_audit();

create function private.application_stage_slug(application_status text)
returns text language sql immutable set search_path = '' as $$
  select case application_status
    when 'received' then 'candidate-received'
    when 'screening' then 'screening'
    when 'cafcm_interview' then 'cafcm-interview'
    when 'referred_company' then 'referred-company'
    when 'company_interview' then 'company-interview'
    when 'waiting_return' then 'waiting-return'
    when 'approved' then 'approved'
    when 'hired' then 'approved'
    when 'talent_pool' then 'talent-pool'
    when 'rejected' then 'not-approved'
    when 'withdrawn' then 'withdrawn'
  end;
$$;
revoke all on function private.application_stage_slug(text) from public, anon, authenticated;

create function private.sync_recruitment_application_pipeline()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pipeline_uuid uuid;
  stage_uuid uuid;
  candidate_name text;
  vacancy_title text;
  company_uuid uuid;
  item_uuid uuid;
begin
  select p.id, s.id into pipeline_uuid, stage_uuid
  from public.pipelines p
  join public.pipeline_stages s on s.pipeline_id = p.id
  where p.slug = 'recruitment' and s.slug = private.application_stage_slug(new.status)
  limit 1;
  if pipeline_uuid is null or stage_uuid is null then return new; end if;

  if new.pipeline_item_id is null then
    select c.full_name, v.title, v.company_id into candidate_name, vacancy_title, company_uuid
    from public.candidates c join public.job_vacancies v on v.id = new.vacancy_id
    where c.id = new.candidate_id;
    insert into public.pipeline_items (
      pipeline_id, stage_id, title, description, company_id, priority, metadata,
      closed_at, created_by
    ) values (
      pipeline_uuid, stage_uuid, coalesce(candidate_name, 'Candidato'),
      concat('Seleção para ', coalesce(vacancy_title, 'vaga')),
      company_uuid, 'normal',
      jsonb_build_object('vacancy_application_id', new.id, 'candidate_id', new.candidate_id, 'vacancy_id', new.vacancy_id),
      case when new.status in ('approved','hired','rejected','withdrawn') then now() else null end,
      new.created_by
    ) returning id into item_uuid;
    update public.vacancy_applications set pipeline_item_id = item_uuid where id = new.id;
  else
    update public.pipeline_items
    set stage_id = stage_uuid,
        closed_at = case when new.status in ('approved','hired','rejected','withdrawn') then coalesce(closed_at, now()) else null end,
        is_archived = false,
        archived_at = null
    where id = new.pipeline_item_id and (stage_id is distinct from stage_uuid or is_archived or
      closed_at is distinct from case when new.status in ('approved','hired','rejected','withdrawn') then coalesce(closed_at, now()) else null end);
  end if;
  return new;
end;
$$;
revoke all on function private.sync_recruitment_application_pipeline() from public, anon, authenticated;
create trigger vacancy_applications_sync_pipeline after insert or update of status on public.vacancy_applications
for each row execute function private.sync_recruitment_application_pipeline();

create function private.sync_candidate_from_application()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.candidates set status = case new.status
    when 'received' then 'new'
    when 'screening' then 'screening'
    when 'cafcm_interview' then 'interview'
    when 'referred_company' then 'interview'
    when 'company_interview' then 'interview'
    when 'waiting_return' then 'interview'
    when 'approved' then 'approved'
    when 'hired' then 'hired'
    when 'rejected' then 'rejected'
    when 'withdrawn' then 'rejected'
    else status
  end where id = new.candidate_id and status is distinct from case new.status
    when 'received' then 'new'
    when 'screening' then 'screening'
    when 'cafcm_interview' then 'interview'
    when 'referred_company' then 'interview'
    when 'company_interview' then 'interview'
    when 'waiting_return' then 'interview'
    when 'approved' then 'approved'
    when 'hired' then 'hired'
    when 'rejected' then 'rejected'
    when 'withdrawn' then 'rejected'
    else status
  end;
  return new;
end;
$$;
revoke all on function private.sync_candidate_from_application() from public, anon, authenticated;
create trigger vacancy_applications_sync_candidate after insert or update of status on public.vacancy_applications
for each row execute function private.sync_candidate_from_application();

create function private.sync_vacancy_capacity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare hired_count integer; vacancy_capacity integer;
begin
  select count(*) into hired_count from public.vacancy_applications where vacancy_id=new.vacancy_id and status='hired';
  select quantity into vacancy_capacity from public.job_vacancies where id=new.vacancy_id;
  if hired_count >= vacancy_capacity then
    update public.job_vacancies set status='filled',closed_at=coalesce(closed_at,now()) where id=new.vacancy_id and status in ('open','paused');
  end if;
  return new;
end; $$;
revoke all on function private.sync_vacancy_capacity() from public, anon, authenticated;
create trigger vacancy_applications_sync_capacity after insert or update of status on public.vacancy_applications
for each row execute function private.sync_vacancy_capacity();

create function private.ensure_admission_pipeline()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pipeline_uuid uuid; stage_uuid uuid; item_uuid uuid; person_name text;
begin
  if new.status='cancelled' and new.pipeline_item_id is not null then
    update public.pipeline_items set closed_at=coalesce(closed_at,now()),is_archived=true,archived_at=coalesce(archived_at,now()) where id=new.pipeline_item_id;
    return new;
  end if;
  select p.id, s.id into pipeline_uuid, stage_uuid from public.pipelines p join public.pipeline_stages s on s.pipeline_id=p.id
  where p.slug='admissions' and s.slug=case new.status
    when 'approved' then 'approved' when 'documents_pending' then 'documents-pending' when 'documents_complete' then 'documents-complete'
    when 'medical_exam' then 'medical-exam' when 'contract_preparation' then 'contract-drafting' when 'signatures_pending' then 'waiting-signatures'
    when 'accounting' then 'accounting-esocial' when 'enrollment' then 'enrollment-course' when 'completed' then 'completed' else null end limit 1;
  if pipeline_uuid is null or stage_uuid is null then return new; end if;
  if new.pipeline_item_id is null then
    select full_name into person_name from public.profiles where id=new.apprentice_id;
    insert into public.pipeline_items(pipeline_id,stage_id,title,company_id,apprentice_id,priority,metadata,closed_at,created_by)
    values(pipeline_uuid,stage_uuid,coalesce(person_name,'Jovem'),new.company_id,new.apprentice_id,'high',jsonb_build_object('admission_id',new.id),case when new.status in ('completed','cancelled') then now() else null end,new.created_by)
    returning id into item_uuid;
    update public.admission_cases set pipeline_item_id=item_uuid where id=new.id;
  else
    update public.pipeline_items set stage_id=stage_uuid, closed_at=case when new.status in ('completed','cancelled') then coalesce(closed_at,now()) else null end
    where id=new.pipeline_item_id and stage_id is distinct from stage_uuid;
  end if;
  return new;
end; $$;
revoke all on function private.ensure_admission_pipeline() from public, anon, authenticated;
create trigger admission_cases_sync_pipeline after insert or update of status on public.admission_cases
for each row execute function private.ensure_admission_pipeline();

create function private.ensure_contract_pipeline()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pipeline_uuid uuid; stage_uuid uuid; item_uuid uuid; person_name text; stage_slug text;
begin
  stage_slug := case new.status when 'scheduled' then 'to-start' when 'active' then 'active' when 'closing' then 'closing' when 'ended' then 'closed' when 'cancelled' then 'closed' end;
  select p.id,s.id into pipeline_uuid,stage_uuid from public.pipelines p join public.pipeline_stages s on s.pipeline_id=p.id where p.slug='contracts' and s.slug=stage_slug limit 1;
  if pipeline_uuid is null or stage_uuid is null then return new; end if;
  if new.pipeline_item_id is null then
    select full_name into person_name from public.profiles where id=new.apprentice_id;
    insert into public.pipeline_items(pipeline_id,stage_id,title,description,company_id,apprentice_id,priority,due_at,metadata,closed_at,created_by)
    values(pipeline_uuid,stage_uuid,coalesce(person_name,'Jovem'),'Contrato de aprendizagem',new.company_id,new.apprentice_id,'normal',(new.end_date::timestamp + time '12:00') at time zone 'America/Sao_Paulo',jsonb_build_object('contract_id',new.id),case when new.status in ('ended','cancelled') then now() else null end,new.created_by)
    returning id into item_uuid;
    update public.contracts set pipeline_item_id=item_uuid where id=new.id;
  else
    update public.pipeline_items set stage_id=stage_uuid,due_at=(new.end_date::timestamp + time '12:00') at time zone 'America/Sao_Paulo',closed_at=case when new.status in ('ended','cancelled') then coalesce(closed_at,now()) else null end
    where id=new.pipeline_item_id and (stage_id is distinct from stage_uuid or due_at::date is distinct from new.end_date);
  end if;
  return new;
end; $$;
revoke all on function private.ensure_contract_pipeline() from public, anon, authenticated;
create trigger contracts_sync_pipeline after insert or update of status, end_date on public.contracts
for each row execute function private.ensure_contract_pipeline();

create function private.ensure_termination_pipeline()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pipeline_uuid uuid; stage_uuid uuid; item_uuid uuid; person_name text; stage_slug text;
begin
  if new.status='cancelled' and new.pipeline_item_id is not null then
    update public.pipeline_items set closed_at=coalesce(closed_at,now()),is_archived=true,archived_at=coalesce(archived_at,now()) where id=new.pipeline_item_id;
    return new;
  end if;
  stage_slug := case new.status when 'medical_exam' then 'medical-exam' when 'documents_delivered' then 'documents-delivered' when 'termination' then 'termination-payment' else replace(new.status,'_','-') end;
  select p.id,s.id into pipeline_uuid,stage_uuid from public.pipelines p join public.pipeline_stages s on s.pipeline_id=p.id where p.slug='terminations' and s.slug=stage_slug limit 1;
  if pipeline_uuid is null or stage_uuid is null then return new; end if;
  if new.pipeline_item_id is null then
    select full_name into person_name from public.profiles where id=new.apprentice_id;
    insert into public.pipeline_items(pipeline_id,stage_id,title,description,company_id,apprentice_id,priority,due_at,metadata,closed_at,created_by)
    values(pipeline_uuid,stage_uuid,coalesce(person_name,'Jovem'),coalesce(new.reason,''),new.company_id,new.apprentice_id,'high',case when new.effective_date is null then null else (new.effective_date::timestamp + time '12:00') at time zone 'America/Sao_Paulo' end,jsonb_build_object('termination_id',new.id),case when new.status in ('completed','cancelled') then now() else null end,new.created_by)
    returning id into item_uuid;
    update public.termination_cases set pipeline_item_id=item_uuid where id=new.id;
  else
    update public.pipeline_items set stage_id=stage_uuid,description=coalesce(new.reason,''),closed_at=case when new.status in ('completed','cancelled') then coalesce(closed_at,now()) else null end
    where id=new.pipeline_item_id and (stage_id is distinct from stage_uuid or description is distinct from coalesce(new.reason,''));
  end if;
  return new;
end; $$;
revoke all on function private.ensure_termination_pipeline() from public, anon, authenticated;
create trigger termination_cases_sync_pipeline after insert or update of status, reason, effective_date on public.termination_cases
for each row execute function private.ensure_termination_pipeline();

create function private.sync_phase_two_record_from_pipeline()
returns trigger language plpgsql security definer set search_path = '' as $$
declare stage_slug text;
begin
  if new.stage_id is not distinct from old.stage_id then return new; end if;
  select slug into stage_slug from public.pipeline_stages where id=new.stage_id;
  if new.metadata ? 'vacancy_application_id' then
    update public.vacancy_applications set status = case stage_slug
      when 'candidate-received' then 'received' when 'screening' then 'screening' when 'cafcm-interview' then 'cafcm_interview'
      when 'referred-company' then 'referred_company' when 'company-interview' then 'company_interview' when 'waiting-return' then 'waiting_return'
      when 'approved' then 'approved' when 'talent-pool' then 'talent_pool' when 'not-approved' then 'rejected' when 'withdrawn' then 'withdrawn' else status end
    where id=(new.metadata->>'vacancy_application_id')::uuid;
  elsif new.metadata ? 'admission_id' then
    update public.admission_cases set status=case stage_slug
      when 'approved' then 'approved' when 'documents-pending' then 'documents_pending' when 'documents-complete' then 'documents_complete'
      when 'medical-exam' then 'medical_exam' when 'contract-drafting' then 'contract_preparation' when 'waiting-signatures' then 'signatures_pending'
      when 'accounting-esocial' then 'accounting' when 'enrollment-course' then 'enrollment' when 'completed' then 'completed' else status end
    where id=(new.metadata->>'admission_id')::uuid;
  elsif new.metadata ? 'contract_id' then
    if stage_slug not in ('expires-90','expires-60','expires-30','expires-15','expires-7') then
      update public.contracts set status=case stage_slug when 'to-start' then 'scheduled' when 'active' then 'active' when 'closing' then 'closing' when 'closed' then 'ended' else status end
      where id=(new.metadata->>'contract_id')::uuid;
    end if;
  elsif new.metadata ? 'termination_id' then
    update public.termination_cases set status=case stage_slug
      when 'request' then 'request' when 'analysis' then 'analysis' when 'medical-exam' then 'medical_exam' when 'documentation' then 'documentation'
      when 'accounting' then 'accounting' when 'termination-payment' then 'termination' when 'finance' then 'finance'
      when 'documents-delivered' then 'documents_delivered' when 'completed' then 'completed' else status end
    where id=(new.metadata->>'termination_id')::uuid;
  end if;
  return new;
end; $$;
revoke all on function private.sync_phase_two_record_from_pipeline() from public, anon, authenticated;
create trigger pipeline_items_sync_phase_two_record after update of stage_id on public.pipeline_items
for each row execute function private.sync_phase_two_record_from_pipeline();

-- Add the seven-day checkpoint without disturbing the existing contract workflow.
insert into public.pipeline_stages (pipeline_id, slug, name, color, position, is_terminal)
select id, 'expires-7', 'Vencimento em 7 dias', '#ffe3e6', 65, false from public.pipelines where slug='contracts'
on conflict (pipeline_id,slug) do update set name=excluded.name,color=excluded.color,position=excluded.position,is_active=true;

alter table public.operational_alerts drop constraint if exists operational_alerts_category_check;
alter table public.operational_alerts add constraint operational_alerts_category_check check (
  category in ('contract','admission','document','task','accounting','termination','leave','vacancy')
);

create or replace function private.refresh_operational_alerts()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.operational_alerts set status='resolved',resolved_at=now() where status='active';

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'contract:'||c.id::text,'contract',c.id::text,'contract',
    case when c.end_date-current_date<=7 then 'urgent' when c.end_date-current_date<=30 then 'attention' else 'information' end,
    case when c.end_date=current_date then 'Contrato encerra hoje' else concat('Contrato vence em ',c.end_date-current_date,' dias') end,
    concat('Contrato de ',p.full_name,' com término em ',to_char(c.end_date,'DD/MM/YYYY'),'.'),c.end_date,'active',null,now(),
    jsonb_build_object('apprentice_id',c.apprentice_id,'company_id',c.company_id,'days_remaining',c.end_date-current_date,'checkpoint',case when c.end_date-current_date<=7 then 7 when c.end_date-current_date<=15 then 15 when c.end_date-current_date<=30 then 30 when c.end_date-current_date<=60 then 60 else 90 end)
  from public.contracts c join public.profiles p on p.id=c.apprentice_id
  where c.status in ('scheduled','active','closing') and c.end_date between current_date and current_date+90
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  update public.pipeline_items item set stage_id=stage.id
  from public.contracts contract
  join public.pipelines pipeline on pipeline.slug='contracts'
  join public.pipeline_stages stage on stage.pipeline_id=pipeline.id and stage.slug=case
    when contract.end_date-current_date<=7 then 'expires-7' when contract.end_date-current_date<=15 then 'expires-15'
    when contract.end_date-current_date<=30 then 'expires-30' when contract.end_date-current_date<=60 then 'expires-60'
    when contract.end_date-current_date<=90 then 'expires-90' else 'active' end
  where item.id=contract.pipeline_item_id and contract.status='active' and contract.end_date>=current_date and item.stage_id is distinct from stage.id;

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'vacancy:'||v.id::text,'vacancy',v.id::text,'vacancy',case when v.due_date<current_date then 'urgent' else 'attention' end,
    case when v.due_date<current_date then 'Prazo da vaga vencido' else 'Prazo da vaga próximo' end,
    concat(v.title,' · ',c.name,' · prazo ',to_char(v.due_date,'DD/MM/YYYY'),'.'),v.due_date,'active',null,now(),jsonb_build_object('company_id',v.company_id,'days_remaining',v.due_date-current_date)
  from public.job_vacancies v join public.companies c on c.id=v.company_id
  where v.status='open' and v.due_date<=current_date+7
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'admission-stalled:'||a.id::text,'admission',a.id::text,'admission',case when a.created_at<now()-interval '10 days' then 'urgent' else 'attention' end,
    'Admissão sem avanço',concat('A admissão de ',p.full_name,' está aberta há ',floor(extract(epoch from now()-a.created_at)/86400),' dias.'),a.target_start_date,'active',null,now(),jsonb_build_object('apprentice_id',a.apprentice_id,'company_id',a.company_id,'status',a.status)
  from public.admission_cases a join public.profiles p on p.id=a.apprentice_id
  where a.status not in ('completed','cancelled') and a.created_at<now()-interval '5 days'
  on conflict(alert_key) do update set severity=excluded.severity,title=excluded.title,message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'admission-documents:'||a.id::text,'admission',a.id::text,'document','attention','Documentos pendentes na admissão',concat(p.full_name,' possui ',count(i.id),' item(ns) obrigatório(s) pendente(s).'),a.target_start_date,'active',null,now(),jsonb_build_object('apprentice_id',a.apprentice_id,'company_id',a.company_id,'pending_items',count(i.id))
  from public.admission_cases a join public.profiles p on p.id=a.apprentice_id join public.admission_checklist_items i on i.admission_id=a.id and i.is_required and not i.is_completed
  where a.status not in ('completed','cancelled') group by a.id,p.full_name
  on conflict(alert_key) do update set message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'task-overdue:'||t.id::text,'task',t.id::text,'task','urgent','Tarefa vencida',concat(t.title,' estava prevista para ',to_char(t.due_at at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI'),'.'),t.due_at::date,'active',null,now(),jsonb_build_object('assigned_to',t.assigned_to,'company_id',t.company_id,'apprentice_id',t.apprentice_id)
  from public.tasks t where t.status not in ('completed','cancelled') and t.due_at<now()
  on conflict(alert_key) do update set message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();

  insert into public.operational_alerts(alert_key,source_type,source_id,category,severity,title,message,due_on,status,resolved_at,last_seen_at,metadata)
  select 'accounting-overdue:'||d.id::text,'accounting',d.id::text,'accounting','attention','Retorno pendente da contabilidade',concat(d.title,' estava previsto para ',to_char(d.due_at at time zone 'America/Sao_Paulo','DD/MM/YYYY HH24:MI'),'.'),d.due_at::date,'active',null,now(),jsonb_build_object('apprentice_id',d.apprentice_id,'company_id',d.company_id,'status',d.status)
  from public.accounting_dispatches d where d.status not in ('completed','verified') and d.due_at<now()
  on conflict(alert_key) do update set message=excluded.message,due_on=excluded.due_on,status='active',resolved_at=null,last_seen_at=now(),metadata=excluded.metadata,updated_at=now();
end; $$;
revoke all on function private.refresh_operational_alerts() from public, anon, authenticated;

update public.vacancy_applications set status=status;
update public.admission_cases set status=status;
update public.contracts set status=status;
update public.termination_cases set status=status;
select private.refresh_operational_alerts();

commit;
