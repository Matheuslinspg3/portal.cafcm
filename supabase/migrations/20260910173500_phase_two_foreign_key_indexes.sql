begin;

create index if not exists candidate_documents_uploaded_by_idx
  on public.candidate_documents(uploaded_by)
  where uploaded_by is not null;

create index if not exists recruitment_events_created_by_idx
  on public.recruitment_events(created_by)
  where created_by is not null;

create index if not exists vacancy_applications_created_by_idx
  on public.vacancy_applications(created_by)
  where created_by is not null;

commit;
