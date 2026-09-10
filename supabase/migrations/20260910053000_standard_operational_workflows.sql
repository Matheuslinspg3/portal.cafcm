begin;

alter table public.tasks add column automation_key text;
alter table public.accounting_dispatches add column automation_key text;

create unique index tasks_automation_key_unique_idx on public.tasks(automation_key) where automation_key is not null;
create unique index accounting_dispatches_automation_key_unique_idx on public.accounting_dispatches(automation_key) where automation_key is not null;

create function private.create_standard_admission_workflow()
returns trigger language plpgsql security definer set search_path = '' as $$
declare apprentice_name text; due_at_value timestamptz;
begin
  select full_name into apprentice_name from public.profiles where id = new.apprentice_id;
  due_at_value := case when new.target_start_date is null then null else (new.target_start_date::timestamp + time '12:00' - interval '3 days') at time zone 'America/Sao_Paulo' end;
  insert into public.admission_checklist_items (admission_id, title, position, is_required) values
    (new.id, 'Cadastro e documentos pessoais conferidos', 1, true),
    (new.id, 'Documentos da empresa vinculados', 2, true),
    (new.id, 'Exame admissional confirmado', 3, true),
    (new.id, 'Contrato revisado e assinado', 4, true),
    (new.id, 'Informações encaminhadas à contabilidade', 5, true),
    (new.id, 'Matrícula e curso vinculados', 6, true),
    (new.id, 'Pasta digital conferida', 7, true);
  insert into public.tasks (title, description, priority, category, company_id, apprentice_id, created_by, due_at, automation_key)
  values (concat('Conduzir admissão: ', coalesce(apprentice_name, 'jovem')), 'Use o checklist automático da admissão. O Portal avisa sobre documentos, prazo e encaminhamento à contabilidade.', 'high', 'Admissão', new.company_id, new.apprentice_id, new.created_by, due_at_value, concat('admission:', new.id::text, ':workflow'))
  on conflict (automation_key) where automation_key is not null do nothing;
  insert into public.accounting_dispatches (dispatch_type, title, description, apprentice_id, company_id, due_at, created_by, automation_key)
  values ('admission', concat('Admissão: ', coalesce(apprentice_name, 'jovem')), 'Preparar e acompanhar o encaminhamento da admissão à contabilidade. Anexe os documentos necessários no Portal antes de marcar como enviado.', new.apprentice_id, new.company_id, due_at_value, new.created_by, concat('admission:', new.id::text, ':accounting'))
  on conflict (automation_key) where automation_key is not null do nothing;
  return new;
end;
$$;
revoke all on function private.create_standard_admission_workflow() from public, anon, authenticated;

create function private.create_standard_leave_workflow()
returns trigger language plpgsql security definer set search_path = '' as $$
declare apprentice_name text;
begin
  select full_name into apprentice_name from public.profiles where id = new.apprentice_id;
  insert into public.accounting_dispatches (dispatch_type, title, description, apprentice_id, due_at, created_by, automation_key)
  values (case when new.leave_type = 'vacation' then 'vacation' else 'leave' end, concat(case when new.leave_type = 'vacation' then 'Férias: ' else 'Afastamento: ' end, coalesce(apprentice_name, 'jovem')), 'Conferir dados do período e encaminhar à contabilidade. O registro original permanece vinculado ao jovem.', new.apprentice_id, (new.start_date::timestamp + time '12:00' - interval '7 days') at time zone 'America/Sao_Paulo', new.created_by, concat('leave:', new.id::text, ':accounting'))
  on conflict (automation_key) where automation_key is not null do nothing;
  return new;
end;
$$;
revoke all on function private.create_standard_leave_workflow() from public, anon, authenticated;

create function private.create_standard_termination_workflow()
returns trigger language plpgsql security definer set search_path = '' as $$
declare apprentice_name text;
begin
  select full_name into apprentice_name from public.profiles where id = new.apprentice_id;
  insert into public.tasks (title, description, priority, category, company_id, apprentice_id, created_by, due_at, automation_key)
  values (concat('Acompanhar desligamento: ', coalesce(apprentice_name, 'jovem')), 'Use o registro de desligamento para centralizar documentos, prazos e o encaminhamento à contabilidade.', 'high', 'Desligamento', new.company_id, new.apprentice_id, new.created_by, case when new.effective_date is null then null else (new.effective_date::timestamp + time '12:00') at time zone 'America/Sao_Paulo' end, concat('termination:', new.id::text, ':workflow'))
  on conflict (automation_key) where automation_key is not null do nothing;
  insert into public.accounting_dispatches (dispatch_type, title, description, apprentice_id, company_id, due_at, created_by, automation_key)
  values ('termination', concat('Desligamento: ', coalesce(apprentice_name, 'jovem')), 'Preparar o encaminhamento à contabilidade e registrar o retorno recebido.', new.apprentice_id, new.company_id, case when new.effective_date is null then null else (new.effective_date::timestamp + time '12:00') at time zone 'America/Sao_Paulo' end, new.created_by, concat('termination:', new.id::text, ':accounting'))
  on conflict (automation_key) where automation_key is not null do nothing;
  return new;
end;
$$;
revoke all on function private.create_standard_termination_workflow() from public, anon, authenticated;

create trigger admission_cases_create_standard_workflow after insert on public.admission_cases for each row execute function private.create_standard_admission_workflow();
create trigger leave_records_create_standard_workflow after insert on public.leave_records for each row execute function private.create_standard_leave_workflow();
create trigger termination_cases_create_standard_workflow after insert on public.termination_cases for each row execute function private.create_standard_termination_workflow();

select private.refresh_operational_alerts();

commit;
