begin;

create index if not exists accounting_dispatches_apprentice_id_idx on public.accounting_dispatches(apprentice_id);
create index if not exists accounting_dispatches_company_id_idx on public.accounting_dispatches(company_id);
create index if not exists accounting_dispatches_contract_id_idx on public.accounting_dispatches(contract_id);
create index if not exists accounting_dispatches_created_by_idx on public.accounting_dispatches(created_by);
create index if not exists accounting_dispatches_responsible_id_idx on public.accounting_dispatches(responsible_id);

create index if not exists admission_cases_company_id_idx on public.admission_cases(company_id);
create index if not exists admission_cases_created_by_idx on public.admission_cases(created_by);
create index if not exists admission_checklist_document_id_idx on public.admission_checklist_items(document_id);
create index if not exists admission_checklist_completed_by_idx on public.admission_checklist_items(completed_by);

create index if not exists candidates_created_by_idx on public.candidates(created_by);
create index if not exists contracts_course_id_idx on public.contracts(course_id);
create index if not exists contracts_created_by_idx on public.contracts(created_by);
create index if not exists contracts_pipeline_item_id_idx on public.contracts(pipeline_item_id);

create index if not exists document_records_admission_id_idx on public.document_records(admission_id);
create index if not exists document_records_contract_id_idx on public.document_records(contract_id);
create index if not exists document_records_uploaded_by_idx on public.document_records(uploaded_by);

create index if not exists email_deliveries_created_by_idx on public.email_deliveries(created_by);
create index if not exists email_deliveries_template_id_idx on public.email_deliveries(template_id);
create index if not exists email_templates_created_by_idx on public.email_templates(created_by);

create index if not exists job_vacancies_created_by_idx on public.job_vacancies(created_by);
create index if not exists leave_records_contract_id_idx on public.leave_records(contract_id);
create index if not exists leave_records_created_by_idx on public.leave_records(created_by);

create index if not exists partnership_agreements_company_id_idx on public.partnership_agreements(company_id);
create index if not exists partnership_agreements_created_by_idx on public.partnership_agreements(created_by);

create index if not exists termination_cases_apprentice_id_idx on public.termination_cases(apprentice_id);
create index if not exists termination_cases_company_id_idx on public.termination_cases(company_id);
create index if not exists termination_cases_contract_id_idx on public.termination_cases(contract_id);
create index if not exists termination_cases_created_by_idx on public.termination_cases(created_by);

create index if not exists vacancy_applications_candidate_id_idx on public.vacancy_applications(candidate_id);

commit;
