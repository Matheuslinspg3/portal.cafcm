begin;

create table public.recurring_charges (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete set null,
  description text not null check (char_length(trim(description)) between 2 and 240),
  frequency text not null default 'monthly' check (frequency in ('monthly', 'yearly')),
  value_rule text not null default 'fixed' check (value_rule in ('fixed', 'per_apprentice', 'payroll_percentage')),
  fixed_amount numeric(12,2) check (fixed_amount is null or fixed_amount >= 0),
  due_day integer not null check (due_day between 1 and 31),
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  requires_review boolean not null default false,
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.charge_batches (
  id uuid primary key default gen_random_uuid(),
  competence date not null,
  status text not null default 'draft' check (status in ('draft', 'review', 'generated', 'cancelled')),
  notes text not null default '' check (char_length(notes) <= 12000),
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(competence)
);

alter table public.financial_charges add column if not exists recurring_charge_id uuid references public.recurring_charges(id) on delete set null;
alter table public.financial_charges add column if not exists batch_id uuid references public.charge_batches(id) on delete set null;
alter table public.financial_charges add constraint unique_recurring_competence unique (recurring_charge_id, competence);

alter table public.recurring_charges enable row level security;
alter table public.charge_batches enable row level security;

create policy recurring_charges_admin_all on public.recurring_charges for all to authenticated using ((select private.current_portal_role()) = 'cafcm_admin') with check ((select private.current_portal_role()) = 'cafcm_admin');
create policy charge_batches_admin_all on public.charge_batches for all to authenticated using ((select private.current_portal_role()) = 'cafcm_admin') with check ((select private.current_portal_role()) = 'cafcm_admin');

grant select, insert, update, delete on public.recurring_charges, public.charge_batches to authenticated;

create trigger recurring_charges_updated_at before update on public.recurring_charges for each row execute function private.set_updated_at();
create trigger charge_batches_updated_at before update on public.charge_batches for each row execute function private.set_updated_at();

commit;
