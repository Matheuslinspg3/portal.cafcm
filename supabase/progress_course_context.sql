begin;

alter table public.lesson_progress
add column course_id uuid references public.courses(id) on delete cascade;

update public.lesson_progress progress
set course_id = lessons.course_id
from public.lessons lessons
where lessons.id = progress.lesson_id;

alter table public.lesson_progress
alter column course_id set not null;

create index lesson_progress_course_id_idx on public.lesson_progress(course_id);

create function private.set_lesson_progress_course()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  select lessons.course_id
  into new.course_id
  from public.lessons lessons
  where lessons.id = new.lesson_id;

  if new.course_id is null then
    raise exception 'A aula informada não existe.';
  end if;

  return new;
end;
$$;

create trigger lesson_progress_set_course_before_write
before insert or update of lesson_id on public.lesson_progress
for each row execute function private.set_lesson_progress_course();

revoke all on function private.set_lesson_progress_course() from public, anon, authenticated;

commit;
