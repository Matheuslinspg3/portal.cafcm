begin;
create table public.candidates (
  id uuid primary key default gen_random_uuid(), full_name text not null check (char_length(trim(full_name)) between 2 and 160), email text, phone text, cpf text, city text not null default '', status text not null default 'new' check (status in ('new','screening','interview','approved','rejected','hired','archived')), notes text not null default '', created_by uuid references public.profiles(id) on delete set null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.job_vacancies (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict, title text not null check (char_length(trim(title)) between 2 and 180), quantity integer not null default 1 check (quantity > 0 and quantity <= 999), status text not null default 'open' check (status in ('draft','open','paused','filled','cancelled')), requirements text not null default '', workload text not null default '', due_date date, created_by uuid references public.profiles(id) on delete set null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.vacancy_applications (
  id uuid primary key default gen_random_uuid(), vacancy_id uuid not null references public.job_vacancies(id) on delete cascade, candidate_id uuid not null references public.candidates(id) on delete cascade, status text not null default 'applied' check (status in ('applied','screening','interview','approved','rejected','referred','hired')), notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(vacancy_id,candidate_id)
);
create table public.partnership_agreements (
  id uuid primary key default gen_random_uuid(), company_id uuid not null references public.companies(id) on delete restrict, title text not null default 'Contrato de parceria', status text not null default 'active' check (status in ('draft','active','expiring','ended','cancelled')), start_date date, end_date date, notes text not null default '', created_by uuid references public.profiles(id) on delete set null default auth.uid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index job_vacancies_company_status_idx on public.job_vacancies(company_id,status);
create index vacancy_applications_vacancy_status_idx on public.vacancy_applications(vacancy_id,status);
create index candidates_status_idx on public.candidates(status);
alter table public.candidates enable row level security; alter table public.job_vacancies enable row level security; alter table public.vacancy_applications enable row level security; alter table public.partnership_agreements enable row level security;
create policy candidates_admin_all on public.candidates for all to authenticated using ((select private.current_portal_role())='cafcm_admin') with check ((select private.current_portal_role())='cafcm_admin');
create policy vacancies_admin_all on public.job_vacancies for all to authenticated using ((select private.current_portal_role())='cafcm_admin') with check ((select private.current_portal_role())='cafcm_admin');
create policy applications_admin_all on public.vacancy_applications for all to authenticated using ((select private.current_portal_role())='cafcm_admin') with check ((select private.current_portal_role())='cafcm_admin');
create policy agreements_admin_all on public.partnership_agreements for all to authenticated using ((select private.current_portal_role())='cafcm_admin') with check ((select private.current_portal_role())='cafcm_admin');
grant select,insert,update,delete on public.candidates,public.job_vacancies,public.vacancy_applications,public.partnership_agreements to authenticated;
create trigger candidates_updated_at before update on public.candidates for each row execute function private.set_updated_at();
create trigger job_vacancies_updated_at before update on public.job_vacancies for each row execute function private.set_updated_at();
create trigger vacancy_applications_updated_at before update on public.vacancy_applications for each row execute function private.set_updated_at();
create trigger partnership_agreements_updated_at before update on public.partnership_agreements for each row execute function private.set_updated_at();
commit;
