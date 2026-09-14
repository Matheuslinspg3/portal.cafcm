begin;

-- Imported records stay separate from authenticated profiles. This keeps the
-- auth.users <-> profiles relationship unchanged while the CAFCM confirms
-- each young person's e-mail before creating access.
create table public.apprentice_registry (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  cpf text not null unique check (cpf ~ '^[0-9]{11}$'),
  birth_date date,
  phone text check (phone is null or char_length(phone) <= 40),
  personal_email text check (personal_email is null or char_length(personal_email) <= 254),
  source_email_value text check (source_email_value is null or char_length(source_email_value) <= 254),
  education jsonb not null default '{}'::jsonb check (jsonb_typeof(education) = 'object'),
  employment_data jsonb not null default '{}'::jsonb check (jsonb_typeof(employment_data) = 'object'),
  source_status text not null default '' check (char_length(source_status) <= 80),
  status text not null default 'active' check (status in ('active', 'ended', 'inactive')),
  access_status text not null default 'email_pending' check (access_status in ('email_pending', 'ready_for_invite', 'linked')),
  notes text not null default '' check (char_length(notes) <= 12000),
  source_system text not null default 'airtable' check (char_length(source_system) between 2 and 40),
  source_base_id text not null check (char_length(source_base_id) between 10 and 80),
  source_interface_id text not null check (char_length(source_interface_id) between 10 and 80),
  source_page_id text not null check (char_length(source_page_id) between 10 and 80),
  source_table_id text not null check (char_length(source_table_id) between 10 and 80),
  source_record_id text not null check (char_length(source_record_id) between 10 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_system, source_base_id, source_table_id, source_record_id)
);

create table public.apprentice_contract_registry (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.apprentice_registry(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  contract_type text not null default 'aprendizagem' check (char_length(trim(contract_type)) between 2 and 80),
  start_date date not null,
  end_date date not null,
  salary numeric(12,2),
  weekly_hours numeric(5,2),
  position_title text not null default '' check (char_length(position_title) <= 160),
  course_name text not null default '' check (char_length(course_name) <= 180),
  work_schedule text not null default '' check (char_length(work_schedule) <= 180),
  source_status text not null default '' check (char_length(source_status) <= 80),
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'closing', 'ended', 'cancelled')),
  notes text not null default '' check (char_length(notes) <= 12000),
  source_system text not null default 'airtable' check (char_length(source_system) between 2 and 40),
  source_base_id text not null check (char_length(source_base_id) between 10 and 80),
  source_interface_id text not null check (char_length(source_interface_id) between 10 and 80),
  source_page_id text not null check (char_length(source_page_id) between 10 and 80),
  source_table_id text not null check (char_length(source_table_id) between 10 and 80),
  source_record_id text not null check (char_length(source_record_id) between 10 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint apprentice_contract_registry_dates_check check (end_date >= start_date),
  unique (source_system, source_base_id, source_table_id, source_record_id)
);

create index apprentice_registry_company_status_idx
  on public.apprentice_registry(company_id, status);
create index apprentice_contract_registry_company_status_idx
  on public.apprentice_contract_registry(company_id, status, end_date);
create index apprentice_contract_registry_apprentice_idx
  on public.apprentice_contract_registry(apprentice_id, end_date);

create trigger apprentice_registry_updated_at
  before update on public.apprentice_registry
  for each row execute function private.set_updated_at();
create trigger apprentice_contract_registry_updated_at
  before update on public.apprentice_contract_registry
  for each row execute function private.set_updated_at();
create trigger apprentice_registry_audit
  after insert or update or delete on public.apprentice_registry
  for each row execute function private.capture_administrative_audit();
create trigger apprentice_contract_registry_audit
  after insert or update or delete on public.apprentice_contract_registry
  for each row execute function private.capture_administrative_audit();

alter table public.apprentice_registry enable row level security;
alter table public.apprentice_contract_registry enable row level security;

revoke all on table public.apprentice_registry, public.apprentice_contract_registry from anon;
grant select, insert, update, delete on table public.apprentice_registry, public.apprentice_contract_registry to authenticated;
grant all on table public.apprentice_registry, public.apprentice_contract_registry to service_role;

create policy apprentice_registry_admin_select
  on public.apprentice_registry for select to authenticated
  using (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('directory.read'))
  );
create policy apprentice_registry_company_select
  on public.apprentice_registry for select to authenticated
  using (
    (select private.current_portal_role()) = 'company'
    and company_id = (select private.current_company_id())
  );
create policy apprentice_registry_admin_insert
  on public.apprentice_registry for insert to authenticated
  with check (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('personnel.manage'))
  );
create policy apprentice_registry_admin_update
  on public.apprentice_registry for update to authenticated
  using (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('personnel.manage'))
  )
  with check (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('personnel.manage'))
  );
create policy apprentice_registry_admin_delete
  on public.apprentice_registry for delete to authenticated
  using (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('personnel.manage'))
  );

create policy apprentice_contract_registry_admin_select
  on public.apprentice_contract_registry for select to authenticated
  using (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('contracts.read'))
  );
create policy apprentice_contract_registry_company_select
  on public.apprentice_contract_registry for select to authenticated
  using (
    (select private.current_portal_role()) = 'company'
    and company_id = (select private.current_company_id())
  );
create policy apprentice_contract_registry_admin_insert
  on public.apprentice_contract_registry for insert to authenticated
  with check (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('contracts.manage'))
  );
create policy apprentice_contract_registry_admin_update
  on public.apprentice_contract_registry for update to authenticated
  using (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('contracts.manage'))
  )
  with check (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('contracts.manage'))
  );
create policy apprentice_contract_registry_admin_delete
  on public.apprentice_contract_registry for delete to authenticated
  using (
    (select private.current_portal_role()) = 'cafcm_admin'
    and (select private.has_portal_permission('contracts.manage'))
  );

comment on table public.apprentice_registry is
  'Imported apprentice cadastral records awaiting verified portal access.';
comment on table public.apprentice_contract_registry is
  'Contracts imported with apprentice_registry records until a profile is linked.';
comment on column public.apprentice_registry.source_email_value is
  'Original Airtable value from Email Aprendiz; may require correction before inviting.';

commit;
