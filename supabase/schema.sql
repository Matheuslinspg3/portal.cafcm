begin;

create extension if not exists pgcrypto;

create type public.portal_role as enum ('cafcm_admin', 'apprentice', 'company');
create type public.course_status as enum ('draft', 'published', 'archived');
create type public.activity_status as enum ('submitted', 'reviewed');

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon, authenticated;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 160),
  role public.portal_role,
  company_id uuid references public.companies(id) on delete set null,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_company_role_check check (
    (role = 'company' and company_id is not null)
    or role is distinct from 'company'
  )
);

create table public.profile_contacts (
  id uuid primary key references public.profiles(id) on delete cascade,
  email text not null,
  updated_at timestamptz not null default now()
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 2 and 180),
  description text not null default '' check (char_length(description) <= 4000),
  status public.course_status not null default 'draft',
  lessons_count integer not null default 0 check (lessons_count >= 0),
  activities_count integer not null default 0 check (activities_count >= 0),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 180),
  content text not null default '' check (char_length(content) <= 30000),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null check (char_length(trim(title)) between 2 and 180),
  instructions text not null default '' check (char_length(instructions) <= 12000),
  due_at timestamptz,
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, position)
);

create table public.enrollments (
  course_id uuid not null references public.courses(id) on delete cascade,
  apprentice_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (course_id, apprentice_id)
);

create table public.lesson_progress (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  apprentice_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (lesson_id, apprentice_id)
);

create table public.activity_attempts (
  activity_id uuid not null references public.activities(id) on delete cascade,
  apprentice_id uuid not null references public.profiles(id) on delete cascade,
  status public.activity_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (activity_id, apprentice_id)
);

create table public.activity_responses (
  activity_id uuid not null,
  apprentice_id uuid not null,
  response_text text not null check (char_length(trim(response_text)) between 1 and 20000),
  updated_at timestamptz not null default now(),
  primary key (activity_id, apprentice_id),
  foreign key (activity_id, apprentice_id)
    references public.activity_attempts(activity_id, apprentice_id)
    on delete cascade
);

create table public.internal_settings (
  key text primary key,
  value text not null,
  claimed_at timestamptz,
  claim_token uuid,
  used_at timestamptz,
  used_by uuid references auth.users(id) on delete set null
);

create index profiles_company_id_idx on public.profiles(company_id);
create index profiles_role_idx on public.profiles(role);
create index courses_created_by_idx on public.courses(created_by);
create index lessons_course_id_idx on public.lessons(course_id);
create index activities_course_id_idx on public.activities(course_id);
create index activities_lesson_id_idx on public.activities(lesson_id);
create index enrollments_apprentice_id_idx on public.enrollments(apprentice_id);
create index lesson_progress_apprentice_id_idx on public.lesson_progress(apprentice_id);
create index activity_attempts_apprentice_id_idx on public.activity_attempts(apprentice_id);
create index activity_attempts_status_idx on public.activity_attempts(status);

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function private.sync_portal_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  portal_role_value public.portal_role;
  company_value uuid;
begin
  portal_role_value := case new.raw_app_meta_data ->> 'portal_role'
    when 'cafcm_admin' then 'cafcm_admin'::public.portal_role
    when 'apprentice' then 'apprentice'::public.portal_role
    when 'company' then 'company'::public.portal_role
    else null
  end;

  company_value := case
    when coalesce(new.raw_app_meta_data ->> 'company_id', '') ~
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
    then (new.raw_app_meta_data ->> 'company_id')::uuid
    else null
  end;

  insert into public.profiles (id, full_name, role, company_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    portal_role_value,
    company_value
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    role = excluded.role,
    company_id = excluded.company_id,
    updated_at = now();

  insert into public.profile_contacts (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

create function private.refresh_course_counts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_course uuid;
begin
  affected_course := coalesce(new.course_id, old.course_id);
  update public.courses
  set
    lessons_count = (select count(*) from public.lessons where course_id = affected_course),
    activities_count = (select count(*) from public.activities where course_id = affected_course),
    updated_at = now()
  where id = affected_course;
  return coalesce(new, old);
end;
$$;

create function private.guard_activity_attempt()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'apprentice' then
    if new.apprentice_id is distinct from (select auth.uid())
       or new.status is distinct from 'submitted'::public.activity_status
       or new.reviewed_at is not null then
      raise exception 'O aprendiz somente pode enviar a própria atividade.';
    end if;
  end if;
  return new;
end;
$$;

create trigger companies_updated_at before update on public.companies
for each row execute function private.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
create trigger courses_updated_at before update on public.courses
for each row execute function private.set_updated_at();
create trigger lessons_updated_at before update on public.lessons
for each row execute function private.set_updated_at();
create trigger activities_updated_at before update on public.activities
for each row execute function private.set_updated_at();
create trigger attempts_updated_at before update on public.activity_attempts
for each row execute function private.set_updated_at();
create trigger responses_updated_at before update on public.activity_responses
for each row execute function private.set_updated_at();

create trigger sync_portal_profile_after_auth_change
after insert or update of email, raw_user_meta_data, raw_app_meta_data on auth.users
for each row execute function private.sync_portal_profile();

create trigger lessons_refresh_course_counts
after insert or update of course_id or delete on public.lessons
for each row execute function private.refresh_course_counts();
create trigger activities_refresh_course_counts
after insert or update of course_id or delete on public.activities
for each row execute function private.refresh_course_counts();
create trigger guard_activity_attempt_before_write
before insert or update on public.activity_attempts
for each row execute function private.guard_activity_attempt();

revoke all on all functions in schema private from public, anon, authenticated;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.activities enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.activity_attempts enable row level security;
alter table public.activity_responses enable row level security;
alter table public.internal_settings enable row level security;

create policy profiles_select_allowed on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'company'
    and role = 'apprentice'
    and company_id = nullif((select auth.jwt() -> 'app_metadata' ->> 'company_id'), '')::uuid
  )
);

create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profile_contacts_select_allowed on public.profile_contacts
for select to authenticated
using (
  id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
);

create policy companies_admin_all on public.companies
for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin');

create policy companies_company_select on public.companies
for select to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'company'
  and id = nullif((select auth.jwt() -> 'app_metadata' ->> 'company_id'), '')::uuid
);

create policy courses_admin_all on public.courses
for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin');

create policy courses_apprentice_select on public.courses
for select to authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.enrollments e
    where e.course_id = courses.id
      and e.apprentice_id = (select auth.uid())
  )
);

create policy courses_company_select on public.courses
for select to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'company'
  and exists (
    select 1
    from public.enrollments e
    join public.profiles p on p.id = e.apprentice_id
    where e.course_id = courses.id
      and p.company_id = nullif((select auth.jwt() -> 'app_metadata' ->> 'company_id'), '')::uuid
  )
);

create policy lessons_admin_all on public.lessons
for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin');

create policy lessons_apprentice_select on public.lessons
for select to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.course_id = lessons.course_id
      and e.apprentice_id = (select auth.uid())
      and c.status = 'published'
  )
);

create policy activities_admin_all on public.activities
for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin');

create policy activities_apprentice_select on public.activities
for select to authenticated
using (
  exists (
    select 1
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where e.course_id = activities.course_id
      and e.apprentice_id = (select auth.uid())
      and c.status = 'published'
  )
);

create policy activities_company_select on public.activities
for select to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'company'
  and exists (
    select 1
    from public.enrollments e
    join public.profiles p on p.id = e.apprentice_id
    where e.course_id = activities.course_id
      and p.company_id = nullif((select auth.jwt() -> 'app_metadata' ->> 'company_id'), '')::uuid
  )
);

create policy enrollments_admin_all on public.enrollments
for all to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin');

create policy enrollments_apprentice_select on public.enrollments
for select to authenticated
using (apprentice_id = (select auth.uid()));

create policy enrollments_company_select on public.enrollments
for select to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'company'
  and exists (
    select 1 from public.profiles p
    where p.id = enrollments.apprentice_id
      and p.company_id = nullif((select auth.jwt() -> 'app_metadata' ->> 'company_id'), '')::uuid
  )
);

create policy lesson_progress_select_allowed on public.lesson_progress
for select to authenticated
using (
  apprentice_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'company'
    and exists (
      select 1 from public.profiles p
      where p.id = lesson_progress.apprentice_id
        and p.company_id = nullif((select auth.jwt() -> 'app_metadata' ->> 'company_id'), '')::uuid
    )
  )
);

create policy lesson_progress_insert_allowed on public.lesson_progress
for insert to authenticated
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
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

create policy lesson_progress_update_allowed on public.lesson_progress
for update to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
)
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

create policy lesson_progress_delete_allowed on public.lesson_progress
for delete to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

create policy activity_attempts_select_allowed on public.activity_attempts
for select to authenticated
using (
  apprentice_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or (
    (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'company'
    and exists (
      select 1 from public.profiles p
      where p.id = activity_attempts.apprentice_id
        and p.company_id = nullif((select auth.jwt() -> 'app_metadata' ->> 'company_id'), '')::uuid
    )
  )
);

create policy activity_attempts_insert_allowed on public.activity_attempts
for insert to authenticated
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
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

create policy activity_attempts_update_allowed on public.activity_attempts
for update to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
)
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

create policy activity_responses_select_allowed on public.activity_responses
for select to authenticated
using (
  apprentice_id = (select auth.uid())
  or (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
);

create policy activity_responses_insert_allowed on public.activity_responses
for insert to authenticated
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

create policy activity_responses_update_allowed on public.activity_responses
for update to authenticated
using (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
)
with check (
  (select auth.jwt() -> 'app_metadata' ->> 'portal_role') = 'cafcm_admin'
  or apprentice_id = (select auth.uid())
);

grant usage on schema public to anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, onboarding_completed) on public.profiles to authenticated;
grant select on public.profile_contacts to authenticated;
grant select, insert, update, delete on public.companies to authenticated;
grant select, insert, update, delete on public.courses to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, update, delete on public.activities to authenticated;
grant select, insert, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant select, insert, update on public.activity_attempts to authenticated;
grant select, insert, update on public.activity_responses to authenticated;

revoke all on public.internal_settings from public, anon, authenticated;

commit;
