begin;

alter table public.companies
  add column legal_name text,
  add column cnpj text,
  add column email text,
  add column phone text,
  add column contact_name text,
  add column contact_role text,
  add column contact_email text,
  add column contact_phone text,
  add column postal_code text,
  add column street text,
  add column street_number text,
  add column address_complement text,
  add column district text,
  add column city text,
  add column state text,
  add column is_active boolean not null default true,
  add column inactivated_at timestamptz;

alter table public.companies
  add constraint companies_legal_name_check
    check (legal_name is null or char_length(trim(legal_name)) between 2 and 200),
  add constraint companies_cnpj_check
    check (cnpj is null or cnpj ~ '^[0-9]{14}$'),
  add constraint companies_email_check
    check (email is null or char_length(email) <= 254),
  add constraint companies_phone_check
    check (phone is null or char_length(phone) <= 20),
  add constraint companies_contact_name_check
    check (contact_name is null or char_length(trim(contact_name)) between 2 and 160),
  add constraint companies_contact_role_check
    check (contact_role is null or char_length(contact_role) <= 120),
  add constraint companies_contact_email_check
    check (contact_email is null or char_length(contact_email) <= 254),
  add constraint companies_contact_phone_check
    check (contact_phone is null or char_length(contact_phone) <= 20),
  add constraint companies_postal_code_check
    check (postal_code is null or postal_code ~ '^[0-9]{8}$'),
  add constraint companies_street_check
    check (street is null or char_length(street) <= 200),
  add constraint companies_street_number_check
    check (street_number is null or char_length(street_number) <= 30),
  add constraint companies_address_complement_check
    check (address_complement is null or char_length(address_complement) <= 120),
  add constraint companies_district_check
    check (district is null or char_length(district) <= 120),
  add constraint companies_city_check
    check (city is null or char_length(city) <= 120),
  add constraint companies_state_check
    check (state is null or state ~ '^[A-Z]{2}$'),
  add constraint companies_status_timestamp_check
    check (
      (is_active and inactivated_at is null)
      or (not is_active and inactivated_at is not null)
    );

create unique index companies_cnpj_unique_idx
  on public.companies(cnpj)
  where cnpj is not null;

create index companies_status_name_idx
  on public.companies(is_active, name);

alter table public.profiles
  drop constraint profiles_company_id_fkey,
  add constraint profiles_company_id_fkey
    foreign key (company_id)
    references public.companies(id)
    on delete restrict;

alter table public.courses
  add column category text not null default '',
  add column objectives text not null default '',
  add column workload_hours numeric(6,2) not null default 0,
  add column published_at timestamptz;

alter table public.courses
  add constraint courses_category_check
    check (char_length(category) <= 120),
  add constraint courses_objectives_check
    check (char_length(objectives) <= 8000),
  add constraint courses_workload_hours_check
    check (workload_hours >= 0 and workload_hours <= 9999.99);

create index courses_status_updated_at_idx
  on public.courses(status, updated_at desc);

commit;
