begin;

-- Fase 5: indicadores reais, metas institucionais e registro voluntário de carga.
-- Não insere metas, tempos ou resultados fictícios.
create table public.work_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  department text not null check (department in ('management','vacancies','coordination','personnel','hr','finance')),
  task_id uuid references public.tasks(id) on delete set null,
  pipeline_item_id uuid references public.pipeline_items(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  category text not null default 'operations' check (char_length(trim(category)) between 2 and 80),
  entry_mode text not null default 'timer' check (entry_mode in ('timer','manual')),
  status text not null default 'running' check (status in ('running','paused','completed','cancelled')),
  started_at timestamptz not null default now(), active_started_at timestamptz, ended_at timestamptz,
  accumulated_seconds integer not null default 0 check (accumulated_seconds >= 0),
  manual_minutes integer not null default 0 check (manual_minutes between 0 and 10080),
  notes text not null default '' check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check ((entry_mode = 'timer') or (manual_minutes > 0 and status = 'completed')),
  check ((status = 'running' and active_started_at is not null and ended_at is null) or (status = 'paused' and active_started_at is null and ended_at is null) or (status in ('completed','cancelled') and active_started_at is null and ended_at is not null))
);

create table public.indicator_targets (
  id uuid primary key default gen_random_uuid(), metric_key text not null check (metric_key ~ '^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+$'),
  label text not null check (char_length(trim(label)) between 2 and 160),
  department text not null default 'all' check (department in ('all','management','vacancies','coordination','personnel','hr','finance')),
  period text not null default 'monthly' check (period in ('current','monthly','quarterly','annual')),
  comparison text not null default 'minimum' check (comparison in ('minimum','maximum')),
  target_value numeric not null check (target_value >= 0), is_active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(metric_key,department,period)
);

create index work_activity_logs_user_started_idx on public.work_activity_logs(user_id,started_at desc);
create index work_activity_logs_department_started_idx on public.work_activity_logs(department,started_at desc);
create index work_activity_logs_task_idx on public.work_activity_logs(task_id) where task_id is not null;
create index work_activity_logs_pipeline_item_idx on public.work_activity_logs(pipeline_item_id) where pipeline_item_id is not null;

create or replace function private.has_portal_permission(permission_name text) returns boolean language sql stable set search_path='' as $$
  select case
    when (select private.current_portal_role()) <> 'cafcm_admin' then false
    when (select private.current_portal_department()) = 'management' then true
    when permission_name in ('directory.read','operations.read','operations.manage','companies.read','reports.read','reports.export') then (select private.current_portal_department()) in ('vacancies','coordination','personnel','hr','finance')
    when permission_name='companies.manage' then (select private.current_portal_department()) in ('vacancies','hr')
    when permission_name in ('vacancies.read','vacancies.manage') then (select private.current_portal_department()) in ('vacancies','hr')
    when permission_name in ('academic.read','academic.manage') then (select private.current_portal_department())='coordination'
    when permission_name='apprentice.history.read' then (select private.current_portal_department()) in ('coordination','personnel','hr')
    when permission_name in ('personnel.read','personnel.manage') then (select private.current_portal_department())='personnel'
    when permission_name='contracts.read' then (select private.current_portal_department()) in ('personnel','finance')
    when permission_name='contracts.manage' then (select private.current_portal_department())='personnel'
    when permission_name in ('documents.read','documents.manage') then (select private.current_portal_department()) in ('personnel','finance')
    when permission_name in ('finance.read','finance.manage') then (select private.current_portal_department()) in ('personnel','finance')
    when permission_name in ('people.read','people.manage','audit.read') then (select private.current_portal_department())='hr'
    when permission_name='targets.manage' then false
    else false end;
$$;

alter table public.work_activity_logs enable row level security;
alter table public.indicator_targets enable row level security;
revoke all on public.work_activity_logs, public.indicator_targets from public, anon;
grant select,insert,update on public.work_activity_logs to authenticated;
grant select,insert,update,delete on public.indicator_targets to authenticated;

create policy work_activity_logs_select on public.work_activity_logs for select to authenticated using (
  (select private.current_portal_role())='cafcm_admin' and (user_id=(select auth.uid()) or (select private.current_portal_department())='management')
);
create policy work_activity_logs_insert_own on public.work_activity_logs for insert to authenticated with check (
  user_id=(select auth.uid()) and (select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('reports.read'))
);
create policy work_activity_logs_update_own on public.work_activity_logs for update to authenticated using (
  user_id=(select auth.uid()) and (select private.current_portal_role())='cafcm_admin'
) with check (user_id=(select auth.uid()) and (select private.current_portal_role())='cafcm_admin');
create policy indicator_targets_select on public.indicator_targets for select to authenticated using (
  (select private.current_portal_role())='cafcm_admin' and (select private.has_portal_permission('reports.read')) and (department='all' or department=(select private.current_portal_department()) or (select private.current_portal_department())='management')
);
create policy indicator_targets_insert on public.indicator_targets for insert to authenticated with check ((select private.has_portal_permission('targets.manage')));
create policy indicator_targets_update on public.indicator_targets for update to authenticated using ((select private.has_portal_permission('targets.manage'))) with check ((select private.has_portal_permission('targets.manage')));
create policy indicator_targets_delete on public.indicator_targets for delete to authenticated using ((select private.has_portal_permission('targets.manage')));

create or replace function private.prepare_work_activity_log() returns trigger language plpgsql set search_path='' as $$
begin
  if new.entry_mode='manual' then new.status='completed'; new.active_started_at=null; new.ended_at=coalesce(new.ended_at,now()); new.accumulated_seconds=new.manual_minutes*60; end if;
  new.updated_at=now(); return new;
end; $$;
create trigger work_activity_logs_prepare before insert or update on public.work_activity_logs for each row execute function private.prepare_work_activity_log();
create trigger work_activity_logs_audit after insert or update on public.work_activity_logs for each row execute function private.capture_administrative_audit();
create trigger indicator_targets_updated_at before update on public.indicator_targets for each row execute function private.set_updated_at();
create trigger indicator_targets_audit after insert or update or delete on public.indicator_targets for each row execute function private.capture_administrative_audit();

create or replace function public.get_portal_indicators(period_start_value date default null, period_end_value date default null)
returns jsonb language plpgsql stable set search_path='' as $$
declare start_on date:=coalesce(period_start_value,current_date-29); end_on date:=coalesce(period_end_value,current_date); department_value text; metrics jsonb:='[]'::jsonb; stages jsonb:='[]'::jsonb; attention jsonb:='[]'::jsonb;
begin
  if (select auth.uid()) is null or (select private.current_portal_role())<>'cafcm_admin' or not (select private.has_portal_permission('reports.read')) then raise exception 'Acesso não autorizado aos indicadores.' using errcode='42501'; end if;
  if start_on>end_on or end_on-start_on>366 then raise exception 'O período deve conter entre 1 e 367 dias.'; end if;
  department_value:=(select private.current_portal_department());
  if (select private.has_portal_permission('operations.read')) then metrics:=metrics||jsonb_build_array(
    jsonb_build_object('key','operations.open_processes','group','operations','label','Processos abertos','value',(select count(*) from public.pipeline_items where not is_archived and closed_at is null),'format','number','destination','pipelines'),
    jsonb_build_object('key','operations.overdue_processes','group','operations','label','Processos atrasados','value',(select count(*) from public.pipeline_items where not is_archived and closed_at is null and due_at<now()),'format','number','destination','pipelines'),
    jsonb_build_object('key','operations.open_tasks','group','operations','label','Tarefas pendentes','value',(select count(*) from public.tasks where status not in ('completed','cancelled')),'format','number','destination','tasks'),
    jsonb_build_object('key','operations.overdue_tasks','group','operations','label','Tarefas vencidas','value',(select count(*) from public.tasks where status not in ('completed','cancelled') and due_at<now()),'format','number','destination','tasks'));
    select coalesce(jsonb_agg(row_data order by pipeline_position,stage_position),'[]') into stages from (
      select p.position pipeline_position,s.position stage_position,jsonb_build_object('pipeline',p.name,'pipeline_key',p.slug,'stage',s.name,'count',count(i.id),'average_days',coalesce(round(avg(extract(epoch from(now()-i.last_moved_at))/86400)::numeric,1),0)) row_data
      from public.pipelines p join public.pipeline_stages s on s.pipeline_id=p.id and s.is_active left join public.pipeline_items i on i.stage_id=s.id and not i.is_archived and i.closed_at is null
      where p.is_active group by p.id,p.name,p.slug,p.position,s.id,s.name,s.position
    ) stage_rows;
  end if;
  if (select private.has_portal_permission('companies.read')) then metrics:=metrics||jsonb_build_array(jsonb_build_object('key','companies.active','group','companies','label','Empresas ativas','value',(select count(*) from public.companies where is_active),'format','number','destination','companies')); end if;
  if (select private.has_portal_permission('directory.read')) then metrics:=metrics||jsonb_build_array(jsonb_build_object('key','apprentices.active','group','apprentices','label','Aprendizes ativos','value',(select count(*) from public.profiles where role='apprentice' and is_active),'format','number','destination','apprentices')); end if;
  if (select private.has_portal_permission('vacancies.read')) then metrics:=metrics||jsonb_build_array(jsonb_build_object('key','vacancies.open','group','vacancies','label','Vagas abertas','value',(select count(*) from public.job_vacancies where status='open'),'format','number','destination','vacancies'),jsonb_build_object('key','vacancies.active_candidates','group','vacancies','label','Candidatos ativos','value',(select count(*) from public.candidates where status not in ('hired','archived','rejected')),'format','number','destination','vacancies')); end if;
  if (select private.has_portal_permission('personnel.read')) then metrics:=metrics||jsonb_build_array(jsonb_build_object('key','personnel.admissions','group','personnel','label','Admissões em andamento','value',(select count(*) from public.admission_cases where status not in ('completed','cancelled')),'format','number','destination','admissions'),jsonb_build_object('key','personnel.pending_documents','group','personnel','label','Documentos pendentes','value',(select count(*) from public.document_requirements where status='pending'),'format','number','destination','documents')); end if;
  if (select private.has_portal_permission('contracts.read')) then metrics:=metrics||jsonb_build_array(jsonb_build_object('key','contracts.active','group','contracts','label','Contratos ativos','value',(select count(*) from public.contracts where status='active'),'format','number','destination','contracts'),jsonb_build_object('key','contracts.expiring_30','group','contracts','label','Vencendo em até 30 dias','value',(select count(*) from public.contracts where status in ('active','closing') and end_date between current_date and current_date+30),'format','number','destination','contracts')); end if;
  if (select private.has_portal_permission('academic.read')) then metrics:=metrics||jsonb_build_array(jsonb_build_object('key','academic.enrolled_students','group','academic','label','Alunos matriculados','value',(select count(distinct apprentice_id) from public.enrollments),'format','number','destination','enrollments'),jsonb_build_object('key','academic.active_courses','group','academic','label','Cursos publicados','value',(select count(*) from public.courses where status::text='published'),'format','number','destination','courses')); end if;
  if (select private.has_portal_permission('finance.read')) then metrics:=metrics||jsonb_build_array(jsonb_build_object('key','finance.receivable','group','finance','label','Contas a receber','value',(select coalesce(sum(amount),0) from public.financial_charges where status not in ('paid','cancelled')),'format','currency','destination','finance'),jsonb_build_object('key','finance.overdue','group','finance','label','Valores vencidos','value',(select coalesce(sum(amount),0) from public.financial_charges where status not in ('paid','cancelled') and due_date<current_date),'format','currency','destination','finance')); end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'category',category,'severity',severity,'title',title,'message',message,'due_on',due_on,'destination',case category when 'contract' then 'contracts' when 'admission' then 'admissions' when 'document' then 'documents' when 'task' then 'tasks' when 'finance' then 'finance' when 'academic' then 'courses' else 'overview' end) order by case severity when 'urgent' then 1 when 'attention' then 2 else 3 end,due_on nulls last),'[]') into attention from (select * from public.operational_alerts where status='active' limit 30) a;
  return jsonb_build_object('generated_at',now(),'period',jsonb_build_object('start',start_on,'end',end_on),'department',department_value,'metrics',metrics,'trend','[]'::jsonb,'bottlenecks',attention,'stages',stages,'productivity',(select jsonb_build_object('visibility',case when department_value='management' then 'institution' else 'personal' end,'recorded_minutes',coalesce(round(sum((accumulated_seconds+case when status='running' and active_started_at is not null then greatest(extract(epoch from(now()-active_started_at)),0)::integer else 0 end)::numeric)/60,0),0),'completed_entries',count(*) filter(where status='completed'),'open_entries',count(*) filter(where status in ('running','paused'))) from public.work_activity_logs where started_at::date between start_on and end_on),'targets',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'metric_key',metric_key,'label',label,'department',department,'period',period,'comparison',comparison,'target_value',target_value)),'[]') from public.indicator_targets where is_active));
end; $$;
revoke all on function public.get_portal_indicators(date,date) from public, anon;
grant execute on function public.get_portal_indicators(date,date) to authenticated;

commit;
