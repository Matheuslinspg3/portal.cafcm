begin;

create table public.apprentice_records (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  cpf text unique,
  birth_date date,
  phone text,
  personal_email text,
  address jsonb not null default '{}'::jsonb check (jsonb_typeof(address) = 'object'),
  education jsonb not null default '{}'::jsonb check (jsonb_typeof(education) = 'object'),
  employment_data jsonb not null default '{}'::jsonb check (jsonb_typeof(employment_data) = 'object'),
  status text not null default 'candidate' check (status in ('candidate', 'admission', 'active', 'leave', 'termination', 'inactive')),
  notes text not null default '' check (char_length(notes) <= 12000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.profiles(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  pipeline_item_id uuid references public.pipeline_items(id) on delete set null,
  contract_type text not null default 'aprendizagem' check (char_length(trim(contract_type)) between 2 and 80),
  start_date date not null,
  end_date date not null,
  salary numeric(12,2),
  weekly_hours numeric(5,2),
  position_title text not null default '' check (char_length(position_title) <= 160),
  course_id uuid references public.courses(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'closing', 'ended', 'cancelled')),
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contracts_dates_check check (end_date >= start_date)
);

create table public.admission_cases (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.profiles(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  pipeline_item_id uuid unique references public.pipeline_items(id) on delete set null,
  contract_id uuid unique references public.contracts(id) on delete set null,
  status text not null default 'approved' check (status in ('approved', 'documents_pending', 'documents_complete', 'medical_exam', 'contract_preparation', 'signatures_pending', 'accounting', 'enrollment', 'completed', 'cancelled')),
  requested_at timestamptz not null default now(),
  target_start_date date,
  completed_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admission_checklist_items (
  id uuid primary key default gen_random_uuid(),
  admission_id uuid not null references public.admission_cases(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 300),
  position integer not null check (position > 0),
  is_required boolean not null default true,
  is_completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references public.profiles(id) on delete set null,
  notes text not null default '' check (char_length(notes) <= 2000),
  document_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (admission_id, position),
  constraint admission_checklist_completion_check check ((is_completed and completed_at is not null) or (not is_completed and completed_at is null and completed_by is null))
);

create table public.document_records (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid references public.profiles(id) on delete restrict,
  company_id uuid references public.companies(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  admission_id uuid references public.admission_cases(id) on delete set null,
  category text not null check (category in ('admission', 'contract', 'documents', 'vacation', 'leave', 'termination', 'accounting', 'other')),
  title text not null check (char_length(trim(title)) between 2 and 180),
  storage_path text not null unique check (char_length(storage_path) between 3 and 1024),
  mime_type text not null default '' check (char_length(mime_type) <= 180),
  file_size bigint check (file_size is null or file_size >= 0),
  is_generated boolean not null default false,
  uploaded_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_records_subject_check check (apprentice_id is not null or company_id is not null)
);

alter table public.admission_checklist_items
  add constraint admission_checklist_document_fkey
  foreign key (document_id) references public.document_records(id) on delete set null;

create table public.accounting_dispatches (
  id uuid primary key default gen_random_uuid(),
  dispatch_type text not null check (dispatch_type in ('admission', 'termination', 'vacation', 'leave', 'payroll', 'registration_change', 'other')),
  status text not null default 'pending' check (status in ('pending', 'preparing', 'sent', 'waiting_response', 'received', 'verified', 'completed')),
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 12000),
  apprentice_id uuid references public.profiles(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  contract_id uuid references public.contracts(id) on delete set null,
  due_at timestamptz,
  sent_at timestamptz,
  received_at timestamptz,
  verified_at timestamptz,
  responsible_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leave_records (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.profiles(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  leave_type text not null check (leave_type in ('vacation', 'medical_leave', 'other_leave')),
  status text not null default 'planned' check (status in ('planned', 'approved', 'in_progress', 'completed', 'cancelled')),
  start_date date not null,
  end_date date not null,
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_records_dates_check check (end_date >= start_date)
);

create table public.termination_cases (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.profiles(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  pipeline_item_id uuid unique references public.pipeline_items(id) on delete set null,
  status text not null default 'request' check (status in ('request', 'analysis', 'medical_exam', 'documentation', 'accounting', 'termination', 'finance', 'documents_delivered', 'completed', 'cancelled')),
  reason text not null default '' check (char_length(reason) <= 2000),
  requested_at timestamptz not null default now(),
  effective_date date,
  completed_at timestamptz,
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_templates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 2 and 120),
  subject text not null check (char_length(trim(subject)) between 2 and 240),
  body text not null check (char_length(trim(body)) between 2 and 30000),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.email_deliveries (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references public.email_templates(id) on delete set null,
  recipient_email text not null check (char_length(trim(recipient_email)) between 3 and 320),
  subject text not null check (char_length(trim(subject)) between 2 and 240),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  entity_type text not null default '' check (char_length(entity_type) <= 80),
  entity_id text not null default '' check (char_length(entity_id) <= 120),
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contracts_apprentice_end_date_idx on public.contracts(apprentice_id, end_date);
create index contracts_company_status_idx on public.contracts(company_id, status);
create index admission_cases_status_idx on public.admission_cases(status, target_start_date);
create index admission_cases_apprentice_idx on public.admission_cases(apprentice_id);
create index document_records_apprentice_category_idx on public.document_records(apprentice_id, category);
create index document_records_company_category_idx on public.document_records(company_id, category) where company_id is not null;
create index accounting_dispatches_status_due_idx on public.accounting_dispatches(status, due_at);
create index leave_records_apprentice_dates_idx on public.leave_records(apprentice_id, start_date, end_date);
create index termination_cases_status_idx on public.termination_cases(status, effective_date);
create index email_deliveries_status_idx on public.email_deliveries(status, created_at desc);

create trigger apprentice_records_updated_at before update on public.apprentice_records for each row execute function private.set_updated_at();
create trigger contracts_updated_at before update on public.contracts for each row execute function private.set_updated_at();
create trigger admission_cases_updated_at before update on public.admission_cases for each row execute function private.set_updated_at();
create trigger admission_checklist_items_updated_at before update on public.admission_checklist_items for each row execute function private.set_updated_at();
create trigger document_records_updated_at before update on public.document_records for each row execute function private.set_updated_at();
create trigger accounting_dispatches_updated_at before update on public.accounting_dispatches for each row execute function private.set_updated_at();
create trigger leave_records_updated_at before update on public.leave_records for each row execute function private.set_updated_at();
create trigger termination_cases_updated_at before update on public.termination_cases for each row execute function private.set_updated_at();
create trigger email_templates_updated_at before update on public.email_templates for each row execute function private.set_updated_at();
create trigger email_deliveries_updated_at before update on public.email_deliveries for each row execute function private.set_updated_at();

create function private.sync_admission_checklist_completion()
returns trigger language plpgsql set search_path = '' as $$
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
revoke all on function private.sync_admission_checklist_completion() from public, anon, authenticated;
create trigger admission_checklist_completion before insert or update of is_completed on public.admission_checklist_items for each row execute function private.sync_admission_checklist_completion();

create function private.sync_admission_status_when_complete()
returns trigger language plpgsql security definer set search_path = '' as $$
declare all_done boolean; admission_uuid uuid := coalesce(new.admission_id, old.admission_id);
begin
  select not exists (
    select 1 from public.admission_checklist_items
    where admission_id = admission_uuid and is_required and not is_completed
  ) into all_done;
  if all_done then
    update public.admission_cases
    set status = case when status in ('approved', 'documents_pending', 'documents_complete') then 'documents_complete' else status end
    where id = admission_uuid;
  end if;
  return new;
end;
$$;
revoke all on function private.sync_admission_status_when_complete() from public, anon, authenticated;
create trigger admission_checklist_sync_case after insert or update of is_completed or delete on public.admission_checklist_items for each row execute function private.sync_admission_status_when_complete();

create function private.capture_administrative_audit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare actor uuid := (select auth.uid()); record_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  if actor is null then return coalesce(new, old); end if;
  insert into public.audit_logs (actor_id, subject_user_id, action, entity_type, entity_id, details)
  values (actor, nullif(record_data ->> 'apprentice_id', '')::uuid, tg_table_name || '.' || lower(tg_op), tg_table_name, coalesce(record_data ->> 'id', record_data ->> 'profile_id', ''), jsonb_strip_nulls(jsonb_build_object('label', coalesce(record_data ->> 'title', record_data ->> 'name', record_data ->> 'subject', record_data ->> 'status'), 'company_id', record_data ->> 'company_id', 'apprentice_id', record_data ->> 'apprentice_id', 'status', record_data ->> 'status')));
  return coalesce(new, old);
end;
$$;
revoke all on function private.capture_administrative_audit() from public, anon, authenticated;

create trigger apprentice_records_audit after insert or update or delete on public.apprentice_records for each row execute function private.capture_administrative_audit();
create trigger contracts_audit after insert or update or delete on public.contracts for each row execute function private.capture_administrative_audit();
create trigger admission_cases_audit after insert or update or delete on public.admission_cases for each row execute function private.capture_administrative_audit();
create trigger admission_checklist_audit after insert or update or delete on public.admission_checklist_items for each row execute function private.capture_administrative_audit();
create trigger document_records_audit after insert or update or delete on public.document_records for each row execute function private.capture_administrative_audit();
create trigger accounting_dispatches_audit after insert or update or delete on public.accounting_dispatches for each row execute function private.capture_administrative_audit();
create trigger leave_records_audit after insert or update or delete on public.leave_records for each row execute function private.capture_administrative_audit();
create trigger termination_cases_audit after insert or update or delete on public.termination_cases for each row execute function private.capture_administrative_audit();
create trigger email_templates_audit after insert or update or delete on public.email_templates for each row execute function private.capture_administrative_audit();
create trigger email_deliveries_audit after insert or update or delete on public.email_deliveries for each row execute function private.capture_administrative_audit();

alter table public.apprentice_records enable row level security;
alter table public.contracts enable row level security;
alter table public.admission_cases enable row level security;
alter table public.admission_checklist_items enable row level security;
alter table public.document_records enable row level security;
alter table public.accounting_dispatches enable row level security;
alter table public.leave_records enable row level security;
alter table public.termination_cases enable row level security;
alter table public.email_templates enable row level security;
alter table public.email_deliveries enable row level security;

do $$
declare table_name text;
begin
  foreach table_name in array array['apprentice_records','contracts','admission_cases','admission_checklist_items','document_records','accounting_dispatches','leave_records','termination_cases','email_templates','email_deliveries'] loop
    execute format('create policy %I on public.%I for all to authenticated using ((select private.current_portal_role()) = ''cafcm_admin'') with check ((select private.current_portal_role()) = ''cafcm_admin'')', table_name || '_cafcm_admin_all', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cafcm-documents', 'cafcm-documents', false, 26214400, array['application/pdf','image/jpeg','image/png','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy cafcm_documents_admin_select on storage.objects for select to authenticated
using (bucket_id = 'cafcm-documents' and (select private.current_portal_role()) = 'cafcm_admin');
create policy cafcm_documents_admin_insert on storage.objects for insert to authenticated
with check (bucket_id = 'cafcm-documents' and (select private.current_portal_role()) = 'cafcm_admin');
create policy cafcm_documents_admin_update on storage.objects for update to authenticated
using (bucket_id = 'cafcm-documents' and (select private.current_portal_role()) = 'cafcm_admin')
with check (bucket_id = 'cafcm-documents' and (select private.current_portal_role()) = 'cafcm_admin');
create policy cafcm_documents_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'cafcm-documents' and (select private.current_portal_role()) = 'cafcm_admin');

commit;
