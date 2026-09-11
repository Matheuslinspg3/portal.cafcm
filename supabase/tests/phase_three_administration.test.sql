begin;

select plan(12);

select has_table('public', 'financial_charges', 'financeiro da Fase 3 foi criado');
select has_table('public', 'document_requirements', 'pendências documentais foram criadas');
select has_table('public', 'termination_checklist_items', 'checklist de desligamento foi criado');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.financial_charges'::regclass),
  'cobranças usam RLS'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.document_requirements'::regclass),
  'pendências documentais usam RLS'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.termination_checklist_items'::regclass),
  'checklists de desligamento usam RLS'
);

select ok(
  not has_table_privilege('anon', 'public.financial_charges', 'select'),
  'cobranças não são públicas'
);
select ok(
  not has_table_privilege('anon', 'public.document_requirements', 'select'),
  'pendências documentais não são públicas'
);
select ok(
  not has_table_privilege('anon', 'public.termination_checklist_items', 'select'),
  'checklists não são públicos'
);

select has_trigger('public', 'termination_cases', 'termination_cases_seed_checklist', 'novos desligamentos recebem checklist');
select has_trigger('public', 'leave_records', 'leave_records_validate_relationships', 'afastamentos validam contrato e jovem');
select has_trigger('public', 'financial_charges', 'financial_charges_validate_relationships', 'cobranças validam contrato e empresa');

select * from finish();
rollback;
