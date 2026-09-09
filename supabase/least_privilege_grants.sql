begin;

revoke all on public.companies from anon, authenticated;
revoke all on public.profiles from anon, authenticated;
revoke all on public.profile_contacts from anon, authenticated;
revoke all on public.courses from anon, authenticated;
revoke all on public.lessons from anon, authenticated;
revoke all on public.activities from anon, authenticated;
revoke all on public.enrollments from anon, authenticated;
revoke all on public.lesson_progress from anon, authenticated;
revoke all on public.activity_attempts from anon, authenticated;
revoke all on public.activity_responses from anon, authenticated;
revoke all on public.internal_settings from anon, authenticated;
revoke all on public.pending_invites from anon, authenticated;

grant usage on schema public to authenticated;
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

commit;
