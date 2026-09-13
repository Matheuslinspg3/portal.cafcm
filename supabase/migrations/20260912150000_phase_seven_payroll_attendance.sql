begin;

create table public.payroll_competences (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  month char(7) not null check (month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  status text not null default 'open' check (status in ('open', 'attendance', 'occurrences', 'preparation', 'conference', 'authorization', 'ready_for_finance', 'completed')),
  notes text not null default '' check (char_length(notes) <= 12000),
  payroll_document_id text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, month)
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  competence_id uuid not null references public.payroll_competences(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'received')),
  document_id text,
  notes text not null default '' check (char_length(notes) <= 12000),
  registered_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(competence_id)
);

create table public.occurrences (
  id uuid primary key default gen_random_uuid(),
  apprentice_id uuid not null references public.profiles(id) on delete restrict,
  company_id uuid not null references public.companies(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  competence_id uuid references public.payroll_competences(id) on delete cascade,
  leave_record_id uuid references public.leave_records(id) on delete set null,
  occurrence_type text not null check (occurrence_type in ('absence', 'delay', 'medical_certificate', 'other')),
  date date not null,
  payroll_impact text not null default 'none' check (payroll_impact in ('none', 'discount', 'allowance')),
  document_id text,
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payroll_competences enable row level security;
alter table public.attendance_records enable row level security;
alter table public.occurrences enable row level security;

create policy payroll_competences_admin_all on public.payroll_competences for all to authenticated using ((select private.current_portal_role()) = 'cafcm_admin') with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy attendance_records_admin_all on public.attendance_records for all to authenticated using ((select private.current_portal_role()) = 'cafcm_admin') with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy occurrences_admin_all on public.occurrences for all to authenticated using ((select private.current_portal_role()) = 'cafcm_admin') with check ((select private.current_portal_role()) = 'cafcm_admin');

grant select, insert, update, delete on public.payroll_competences, public.attendance_records, public.occurrences to authenticated;

create trigger payroll_competences_updated_at before update on public.payroll_competences for each row execute function private.set_updated_at();
create trigger attendance_records_updated_at before update on public.attendance_records for each row execute function private.set_updated_at();
create trigger occurrences_updated_at before update on public.occurrences for each row execute function private.set_updated_at();

commit;
