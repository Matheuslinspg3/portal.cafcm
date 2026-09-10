begin;

select plan(8);

insert into public.companies (id, name)
values ('10000000-0000-4000-8000-000000000001', 'Teste transacional Fase 2');

insert into public.candidates (id, full_name, email, status)
values ('10000000-0000-4000-8000-000000000002', 'Candidato teste', 'fase2-teste@example.com', 'new');

insert into public.job_vacancies (id, company_id, title, quantity, status)
values ('10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Vaga teste', 1, 'open');

insert into public.vacancy_applications (id, vacancy_id, candidate_id, status)
values ('10000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'received');

select ok(
  (select pipeline_item_id is not null from public.vacancy_applications where id = '10000000-0000-4000-8000-000000000004'),
  'a seleção cria um cartão na esteira de recrutamento'
);

select is(
  (select stage.slug from public.vacancy_applications application join public.pipeline_items item on item.id = application.pipeline_item_id join public.pipeline_stages stage on stage.id = item.stage_id where application.id = '10000000-0000-4000-8000-000000000004'),
  'candidate-received',
  'a seleção começa em candidato recebido'
);

update public.pipeline_items
set stage_id = (select stage.id from public.pipeline_stages stage join public.pipelines pipeline on pipeline.id = stage.pipeline_id where pipeline.slug = 'recruitment' and stage.slug = 'company-interview')
where id = (select pipeline_item_id from public.vacancy_applications where id = '10000000-0000-4000-8000-000000000004');

select is(
  (select status from public.vacancy_applications where id = '10000000-0000-4000-8000-000000000004'),
  'company_interview',
  'mover a esteira atualiza a etapa da seleção'
);

select ok(
  (select count(*) >= 2 from public.recruitment_events where application_id = '10000000-0000-4000-8000-000000000004'),
  'o histórico registra criação e mudança de etapa'
);

update public.vacancy_applications set status = 'hired'
where id = '10000000-0000-4000-8000-000000000004';

select is(
  (select status from public.job_vacancies where id = '10000000-0000-4000-8000-000000000003'),
  'filled',
  'a vaga é preenchida quando atinge sua capacidade'
);

select is(
  (select status from public.candidates where id = '10000000-0000-4000-8000-000000000002'),
  'hired',
  'o candidato acompanha o resultado da seleção'
);

select ok(
  not has_table_privilege('anon', 'public.candidate_documents', 'select'),
  'documentos de candidatos não são públicos'
);

select ok(
  not has_table_privilege('authenticated', 'public.recruitment_events', 'insert'),
  'o navegador não pode adulterar o histórico de recrutamento'
);

select * from finish();
rollback;
