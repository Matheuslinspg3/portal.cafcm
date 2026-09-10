begin;

alter table public.profiles
  add column if not exists department text;

alter table public.pending_invites
  add column if not exists department text;

update public.profiles
set department = 'management'
where role = 'cafcm_admin'
  and department is null;

update public.profiles
set department = null
where role is distinct from 'cafcm_admin'
  and department is not null;

update public.pending_invites
set department = 'management'
where role = 'cafcm_admin'
  and department is null;

update public.pending_invites
set department = null
where role is distinct from 'cafcm_admin'
  and department is not null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_department_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_department_role_check check (
        (
          role = 'cafcm_admin'
          and company_id is null
          and department in ('management', 'vacancies', 'coordination', 'personnel', 'hr', 'finance')
        )
        or (
          role is distinct from 'cafcm_admin'
          and department is null
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'pending_invites_department_role_check'
      and conrelid = 'public.pending_invites'::regclass
  ) then
    alter table public.pending_invites
      add constraint pending_invites_department_role_check check (
        (
          role = 'cafcm_admin'
          and company_id is null
          and department in ('management', 'vacancies', 'coordination', 'personnel', 'hr', 'finance')
        )
        or (
          role is distinct from 'cafcm_admin'
          and department is null
        )
      );
  end if;
end
$$;

create index if not exists profiles_department_active_idx
  on public.profiles(department, is_active)
  where role = 'cafcm_admin';

create or replace function private.current_portal_department()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when (select private.current_portal_role()) = 'cafcm_admin'
      then coalesce((select auth.jwt()) -> 'app_metadata' ->> 'portal_department', 'management')
    else null
  end;
$$;

create or replace function private.has_portal_permission(permission_name text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when (select private.current_portal_role()) <> 'cafcm_admin' then false
    when (select private.current_portal_department()) = 'management' then true
    when permission_name in ('directory.read', 'operations.read', 'operations.manage', 'companies.read')
      then (select private.current_portal_department()) in ('vacancies', 'coordination', 'personnel', 'hr', 'finance')
    when permission_name = 'companies.manage'
      then (select private.current_portal_department()) in ('vacancies', 'hr')
    when permission_name in ('vacancies.read', 'vacancies.manage')
      then (select private.current_portal_department()) in ('vacancies', 'hr')
    when permission_name in ('academic.read', 'academic.manage')
      then (select private.current_portal_department()) = 'coordination'
    when permission_name = 'apprentice.history.read'
      then (select private.current_portal_department()) in ('coordination', 'personnel', 'hr')
    when permission_name in ('personnel.read', 'personnel.manage')
      then (select private.current_portal_department()) = 'personnel'
    when permission_name = 'contracts.read'
      then (select private.current_portal_department()) in ('personnel', 'finance')
    when permission_name = 'contracts.manage'
      then (select private.current_portal_department()) = 'personnel'
    when permission_name in ('documents.read', 'documents.manage')
      then (select private.current_portal_department()) in ('personnel', 'finance')
    when permission_name in ('finance.read', 'finance.manage')
      then (select private.current_portal_department()) in ('personnel', 'finance')
    when permission_name in ('people.read', 'people.manage')
      then (select private.current_portal_department()) = 'hr'
    when permission_name = 'audit.read'
      then (select private.current_portal_department()) = 'hr'
    else false
  end;
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_portal_department() to authenticated;
grant execute on function private.has_portal_permission(text) to authenticated;

create or replace function private.sync_portal_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  portal_role_value public.portal_role;
  company_value uuid;
  department_value text;
  pending public.pending_invites%rowtype;
  profile_name text;
begin
  select invite.*
  into pending
  from public.pending_invites invite
  where lower(invite.email) = lower(new.email)
  limit 1;

  portal_role_value := case new.raw_app_meta_data ->> 'portal_role'
    when 'cafcm_admin' then 'cafcm_admin'::public.portal_role
    when 'apprentice' then 'apprentice'::public.portal_role
    when 'company' then 'company'::public.portal_role
    else pending.role
  end;

  company_value := case
    when coalesce(new.raw_app_meta_data ->> 'company_id', '') ~
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    then (new.raw_app_meta_data ->> 'company_id')::uuid
    else pending.company_id
  end;

  department_value := case
    when portal_role_value = 'cafcm_admin' then coalesce(
      case new.raw_app_meta_data ->> 'portal_department'
        when 'management' then 'management'
        when 'vacancies' then 'vacancies'
        when 'coordination' then 'coordination'
        when 'personnel' then 'personnel'
        when 'hr' then 'hr'
        when 'finance' then 'finance'
        else null
      end,
      pending.department,
      (select profile.department from public.profiles profile where profile.id = new.id),
      'management'
    )
    else null
  end;

  if portal_role_value = 'cafcm_admin' then
    company_value := null;
  end if;

  profile_name := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    pending.full_name,
    ''
  );

  insert into public.profiles (id, full_name, role, company_id, department)
  values (new.id, profile_name, portal_role_value, company_value, department_value)
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    company_id = excluded.company_id,
    department = excluded.department,
    updated_at = now();

  insert into public.profile_contacts (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

revoke all on function private.sync_portal_profile() from public, anon, authenticated;

update auth.users auth_user
set raw_app_meta_data = coalesce(auth_user.raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('portal_role', 'cafcm_admin', 'portal_department', coalesce(profile.department, 'management'))
from public.profiles profile
where profile.id = auth_user.id
  and profile.role = 'cafcm_admin';

update auth.users auth_user
set raw_app_meta_data = coalesce(auth_user.raw_app_meta_data, '{}'::jsonb) - 'portal_department'
from public.profiles profile
where profile.id = auth_user.id
  and profile.role is distinct from 'cafcm_admin';

do $$
declare
  access_rule record;
begin
  for access_rule in
    select * from (values
      ('companies', 'companies.read', 'companies.manage'),
      ('candidates', 'vacancies.read', 'vacancies.manage'),
      ('job_vacancies', 'vacancies.read', 'vacancies.manage'),
      ('vacancy_applications', 'vacancies.read', 'vacancies.manage'),
      ('partnership_agreements', 'vacancies.read', 'vacancies.manage'),
      ('courses', 'academic.read', 'academic.manage'),
      ('lessons', 'academic.read', 'academic.manage'),
      ('lesson_blocks', 'academic.read', 'academic.manage'),
      ('activities', 'academic.read', 'academic.manage'),
      ('enrollments', 'academic.read', 'academic.manage'),
      ('lesson_progress', 'academic.read', 'academic.manage'),
      ('activity_attempts', 'academic.read', 'academic.manage'),
      ('activity_responses', 'academic.read', 'academic.manage'),
      ('apprentice_records', 'personnel.read', 'personnel.manage'),
      ('admission_cases', 'personnel.read', 'personnel.manage'),
      ('admission_checklist_items', 'personnel.read', 'personnel.manage'),
      ('leave_records', 'personnel.read', 'personnel.manage'),
      ('termination_cases', 'personnel.read', 'personnel.manage'),
      ('contracts', 'contracts.read', 'contracts.manage'),
      ('document_records', 'documents.read', 'documents.manage'),
      ('accounting_dispatches', 'finance.read', 'finance.manage'),
      ('email_templates', 'finance.read', 'finance.manage'),
      ('email_deliveries', 'finance.read', 'finance.manage'),
      ('audit_logs', 'audit.read', 'audit.read'),
      ('pipelines', 'operations.read', 'operations.manage'),
      ('pipeline_stages', 'operations.read', 'operations.manage'),
      ('pipeline_items', 'operations.read', 'operations.manage'),
      ('pipeline_item_movements', 'operations.read', 'operations.manage'),
      ('tasks', 'operations.read', 'operations.manage'),
      ('task_checklist_items', 'operations.read', 'operations.manage'),
      ('notifications', 'operations.read', 'operations.manage'),
      ('operational_alerts', 'operations.read', 'operations.manage')
    ) as rules(table_name, read_permission, write_permission)
  loop
    execute format('drop policy if exists %I on public.%I', 'department_select_guard_' || access_rule.table_name, access_rule.table_name);
    execute format(
      'create policy %I on public.%I as restrictive for select to authenticated using (coalesce((select private.current_portal_role()), '''') <> ''cafcm_admin'' or (select private.has_portal_permission(%L)))',
      'department_select_guard_' || access_rule.table_name,
      access_rule.table_name,
      access_rule.read_permission
    );

    if access_rule.table_name <> 'audit_logs' then
      execute format('drop policy if exists %I on public.%I', 'department_insert_guard_' || access_rule.table_name, access_rule.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for insert to authenticated with check (coalesce((select private.current_portal_role()), '''') <> ''cafcm_admin'' or (select private.has_portal_permission(%L)))',
        'department_insert_guard_' || access_rule.table_name,
        access_rule.table_name,
        access_rule.write_permission
      );

      execute format('drop policy if exists %I on public.%I', 'department_update_guard_' || access_rule.table_name, access_rule.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for update to authenticated using (coalesce((select private.current_portal_role()), '''') <> ''cafcm_admin'' or (select private.has_portal_permission(%L))) with check (coalesce((select private.current_portal_role()), '''') <> ''cafcm_admin'' or (select private.has_portal_permission(%L)))',
        'department_update_guard_' || access_rule.table_name,
        access_rule.table_name,
        access_rule.write_permission,
        access_rule.write_permission
      );

      execute format('drop policy if exists %I on public.%I', 'department_delete_guard_' || access_rule.table_name, access_rule.table_name);
      execute format(
        'create policy %I on public.%I as restrictive for delete to authenticated using (coalesce((select private.current_portal_role()), '''') <> ''cafcm_admin'' or (select private.has_portal_permission(%L)))',
        'department_delete_guard_' || access_rule.table_name,
        access_rule.table_name,
        access_rule.write_permission
      );
    end if;
  end loop;
end
$$;

drop policy if exists department_select_guard_profiles on public.profiles;
create policy department_select_guard_profiles on public.profiles
as restrictive for select to authenticated
using (
  coalesce((select private.current_portal_role()), '') <> 'cafcm_admin'
  or (select private.has_portal_permission('directory.read'))
);

drop policy if exists department_select_guard_profile_contacts on public.profile_contacts;
create policy department_select_guard_profile_contacts on public.profile_contacts
as restrictive for select to authenticated
using (
  coalesce((select private.current_portal_role()), '') <> 'cafcm_admin'
  or (select private.has_portal_permission('people.read'))
);

drop policy if exists cafcm_documents_department_select on storage.objects;
create policy cafcm_documents_department_select on storage.objects
as restrictive for select to authenticated
using (
  bucket_id <> 'cafcm-documents'
  or coalesce((select private.current_portal_role()), '') <> 'cafcm_admin'
  or (select private.has_portal_permission('documents.read'))
);

drop policy if exists cafcm_documents_department_insert on storage.objects;
create policy cafcm_documents_department_insert on storage.objects
as restrictive for insert to authenticated
with check (
  bucket_id <> 'cafcm-documents'
  or coalesce((select private.current_portal_role()), '') <> 'cafcm_admin'
  or (select private.has_portal_permission('documents.manage'))
);

drop policy if exists cafcm_documents_department_update on storage.objects;
create policy cafcm_documents_department_update on storage.objects
as restrictive for update to authenticated
using (
  bucket_id <> 'cafcm-documents'
  or coalesce((select private.current_portal_role()), '') <> 'cafcm_admin'
  or (select private.has_portal_permission('documents.manage'))
)
with check (
  bucket_id <> 'cafcm-documents'
  or coalesce((select private.current_portal_role()), '') <> 'cafcm_admin'
  or (select private.has_portal_permission('documents.manage'))
);

drop policy if exists cafcm_documents_department_delete on storage.objects;
create policy cafcm_documents_department_delete on storage.objects
as restrictive for delete to authenticated
using (
  bucket_id <> 'cafcm-documents'
  or coalesce((select private.current_portal_role()), '') <> 'cafcm_admin'
  or (select private.has_portal_permission('documents.manage'))
);

commit;
