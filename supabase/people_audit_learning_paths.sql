begin;

alter table public.profiles
  add column is_active boolean not null default true,
  add column archived_at timestamptz,
  add column archived_by uuid;

create index profiles_is_active_idx on public.profiles(is_active);
create index profiles_archived_by_idx on public.profiles(archived_by) where archived_by is not null;

alter table public.lessons
  add column summary text not null default '' check (char_length(summary) <= 2000),
  add column estimated_minutes integer check (estimated_minutes is null or estimated_minutes between 1 and 1440);

create table public.lesson_blocks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  block_type text not null check (block_type in ('text', 'slides', 'video', 'considerations')),
  title text not null default '' check (char_length(title) <= 180),
  content text not null default '' check (char_length(content) <= 60000),
  media_url text check (media_url is null or char_length(media_url) <= 2048),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, position)
);

create index lesson_blocks_lesson_id_idx on public.lesson_blocks(lesson_id);

insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
select lessons.id, 'text', 'Conteúdo da aula', lessons.content, 1
from public.lessons lessons
where trim(lessons.content) <> ''
  and not exists (
    select 1 from public.lesson_blocks blocks where blocks.lesson_id = lessons.id
  );

create trigger lesson_blocks_updated_at
before update on public.lesson_blocks
for each row execute function private.set_updated_at();

alter table public.lesson_blocks enable row level security;

create policy lesson_blocks_select_allowed on public.lesson_blocks
for select to authenticated
using (
  (select private.current_portal_role()) = 'cafcm_admin'
  or exists (
    select 1
    from public.lessons lessons
    join public.enrollments enrollments on enrollments.course_id = lessons.course_id
    join public.courses courses on courses.id = lessons.course_id
    where lessons.id = lesson_blocks.lesson_id
      and enrollments.apprentice_id = (select auth.uid())
      and courses.status = 'published'
  )
);

create policy lesson_blocks_admin_insert on public.lesson_blocks
for insert to authenticated
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy lesson_blocks_admin_update on public.lesson_blocks
for update to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin')
with check ((select private.current_portal_role()) = 'cafcm_admin');

create policy lesson_blocks_admin_delete on public.lesson_blocks
for delete to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

revoke all on public.lesson_blocks from anon, authenticated;
grant select, insert, update, delete on public.lesson_blocks to authenticated;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  subject_user_id uuid,
  action text not null check (char_length(action) between 2 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text not null default '',
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index audit_logs_occurred_at_idx on public.audit_logs(occurred_at desc);
create index audit_logs_actor_id_occurred_at_idx on public.audit_logs(actor_id, occurred_at desc);
create index audit_logs_subject_user_id_occurred_at_idx on public.audit_logs(subject_user_id, occurred_at desc);
create index audit_logs_action_occurred_at_idx on public.audit_logs(action, occurred_at desc);

alter table public.audit_logs enable row level security;

create policy audit_logs_admin_select on public.audit_logs
for select to authenticated
using ((select private.current_portal_role()) = 'cafcm_admin');

revoke all on public.audit_logs from public, anon, authenticated;
grant select on public.audit_logs to authenticated;
grant select, insert on public.audit_logs to service_role;

create function private.capture_portal_audit()
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
    when tg_table_name in ('enrollments', 'lesson_progress', 'activity_attempts', 'activity_responses')
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
    'block_type', nullif(record_data ->> 'block_type', ''),
    'course_id', nullif(record_data ->> 'course_id', ''),
    'lesson_id', nullif(record_data ->> 'lesson_id', ''),
    'activity_id', nullif(record_data ->> 'activity_id', ''),
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

create trigger companies_capture_audit
after insert or update or delete on public.companies
for each row execute function private.capture_portal_audit();

create trigger profiles_capture_audit
after insert or update or delete on public.profiles
for each row execute function private.capture_portal_audit();

create trigger courses_capture_audit
after insert or update or delete on public.courses
for each row execute function private.capture_portal_audit();

create trigger lessons_capture_audit
after insert or update or delete on public.lessons
for each row execute function private.capture_portal_audit();

create trigger lesson_blocks_capture_audit
after insert or update or delete on public.lesson_blocks
for each row execute function private.capture_portal_audit();

create trigger activities_capture_audit
after insert or update or delete on public.activities
for each row execute function private.capture_portal_audit();

create trigger enrollments_capture_audit
after insert or update or delete on public.enrollments
for each row execute function private.capture_portal_audit();

create trigger lesson_progress_capture_audit
after insert or update or delete on public.lesson_progress
for each row execute function private.capture_portal_audit();

create trigger activity_attempts_capture_audit
after insert or update or delete on public.activity_attempts
for each row execute function private.capture_portal_audit();

create trigger activity_responses_capture_audit
after insert or update or delete on public.activity_responses
for each row execute function private.capture_portal_audit();

commit;
