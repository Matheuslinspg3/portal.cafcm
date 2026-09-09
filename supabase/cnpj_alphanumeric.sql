begin;

alter table public.companies
  drop constraint companies_cnpj_check,
  add constraint companies_cnpj_check
    check (cnpj is null or cnpj ~ '^[A-Z0-9]{12}[0-9]{2}$');

commit;
