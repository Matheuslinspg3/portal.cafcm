begin;

create index internal_settings_used_by_idx on public.internal_settings(used_by);

create function private.current_portal_role()
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select (select auth.jwt()) -> 'app_metadata' ->> 'portal_role';
$$;

create function private.current_company_id()
returns uuid
language sql
stable
security invoker
set search_path = ''
as $$
  select nullif((select auth.jwt()) -> 'app_metadata' ->> 'company_id', '')::uuid;
$$;

grant usage on schema private to authenticated;
grant execute on function private.current_portal_role() to authenticated;
grant execute on function private.current_company_id() to authenticated;

create policy internal_settings_client_deny on public.internal_settings
as restrictive
for all to anon, authenticated
using (false)
with check (false);

alter policy profiles_select_allowed on public.profiles
using (
  id = (select auth.uid())
  or (select private.current_portal_role()) = 'cafcm_admin'
  or (
    (select private.current_portal_role()) = 'company'
    and role = 'apprentice'
    and company_id = (select private.current_company_id())
  )
);

alter policy profile_contacts_select_allowed on public.profile_contacts
using (
  id = (select auth.uid())
  or (select private.current_portal_role()) = 'cafcm_admin'
);

drop policy companies_admin_all on public.companies;
drop policy companies_company_select on public.companies;

create policy companies_select_allowed on public.companies
for select to authenticated
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or (
    (select private.current_portal_role()) = 'company'
    and id = (select private.current_company_id())
  )
);

create policy companies_admin_insert on public.companies
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy companies_admin_update on public.companies
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy companies_admin_delete on public.companies
for delete to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

drop policy courses_admin_all on public.courses;
drop policy courses_apprentice_select on public.courses;
drop policy courses_company_select on public.courses;

create policy courses_select_allowed on public.courses
for select to authenticated
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or (
    status = 'published'
    and exists (
      select 1 from public.enrollments e
      where e.course_id = courses.id
        and e.apprentice_id = (select auth.uid())
    )
  )
  or (
    (select private.current_portal_role()) = 'company'
    and exists (
      select 1
      from public.enrollments e
      join public.profiles p on p.id = e.apprentice_id
      where e.course_id = courses.id
        and p.company_id = (select private.current_company_id())
    )
  )
);

create policy courses_admin_insert on public.courses
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy courses_admin_update on public.courses
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy courses_admin_delete on public.courses
for delete to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

drop policy lessons_admin_all on public.lessons;
drop policy lessons_apprentice_select on public.lessons;

create policy lessons_select_allowed on public.lessons
for select to authenticated
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.course_id = lessons.course_id
      and e.apprentice_id = (select auth.uid())
      and c.status = 'published'
  )
);

create policy lessons_admin_insert on public.lessons
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy lessons_admin_update on public.lessons
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy lessons_admin_delete on public.lessons
for delete to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

drop policy activities_admin_all on public.activities;
drop policy activities_apprentice_select on public.activities;
drop policy activities_company_select on public.activities;

create policy activities_select_allowed on public.activities
for select to authenticated
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.course_id = activities.course_id
      and e.apprentice_id = (select auth.uid())
      and c.status = 'published'
  )
  or (
    (select private.current_portal_role()) = 'company'
    and exists (
      select 1
      from public.enrollments e
      join public.profiles p on p.id = e.apprentice_id
      where e.course_id = activities.course_id
        and p.company_id = (select private.current_company_id())
    )
  )
);

create policy activities_admin_insert on public.activities
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy activities_admin_update on public.activities
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy activities_admin_delete on public.activities
for delete to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

drop policy enrollments_admin_all on public.enrollments;
drop policy enrollments_apprentice_select on public.enrollments;
drop policy enrollments_company_select on public.enrollments;

create policy enrollments_select_allowed on public.enrollments
for select to authenticated
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
  or (
    (select private.current_portal_role()) = 'company'
    and exists (
      select 1 from public.profiles p
      where p.id = enrollments.apprentice_id
        and p.company_id = (select private.current_company_id())
    )
  )
);

create policy enrollments_admin_insert on public.enrollments
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy enrollments_admin_delete on public.enrollments
for delete to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

alter policy lesson_progress_select_allowed on public.lesson_progress
using (
  apprentice_id = (select auth.uid())
  or (select private.current_portal_role()) = 'cafcm_admin'
  or (
    (select private.current_portal_role()) = 'company'
    and exists (
      select 1 from public.profiles p
      where p.id = lesson_progress.apprentice_id
        and p.company_id = (select private.current_company_id())
    )
  )
);

alter policy lesson_progress_insert_allowed on public.lesson_progress
with check (
  (select private.current_portal_role()) = 'cafcm_admin'
  or (
    apprentice_id = (select auth.uid())
    and exists (
      select 1
      from public.lessons l
      join public.enrollments e on e.course_id = l.course_id
      join public.courses c on c.id = l.course_id
      where l.id = lesson_progress.lesson_id
        and e.apprentice_id = (select auth.uid())
        and c.status = 'published'
    )
  )
);

alter policy lesson_progress_update_allowed on public.lesson_progress
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
)
with check (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

alter policy lesson_progress_delete_allowed on public.lesson_progress
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

alter policy activity_attempts_select_allowed on public.activity_attempts
using (
  apprentice_id = (select auth.uid())
  or (select private.current_portal_role()) = 'cafcm_admin'
  or (
    (select private.current_portal_role()) = 'company'
    and exists (
      select 1 from public.profiles p
      where p.id = activity_attempts.apprentice_id
        and p.company_id = (select private.current_company_id())
    )
  )
);

alter policy activity_attempts_insert_allowed on public.activity_attempts
with check (
  (select private.current_portal_role()) = 'cafcm_admin'
  or (
    apprentice_id = (select auth.uid())
    and exists (
      select 1
      from public.activities a
      join public.enrollments e on e.course_id = a.course_id
      join public.courses c on c.id = a.course_id
      where a.id = activity_attempts.activity_id
        and e.apprentice_id = (select auth.uid())
        and c.status = 'published'
    )
  )
);

alter policy activity_attempts_update_allowed on public.activity_attempts
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
)
with check (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

alter policy activity_responses_select_allowed on public.activity_responses
using (
  apprentice_id = (select auth.uid())
  or (select private.current_portal_role()) = 'cafcm_admin'
);

alter policy activity_responses_insert_allowed on public.activity_responses
with check (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

alter policy activity_responses_update_allowed on public.activity_responses
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
)
with check (
  (select private.current_portal_role()) = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

commit;
