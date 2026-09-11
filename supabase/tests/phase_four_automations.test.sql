begin;

select plan(15);

select has_table('public', 'automation_runs', 'execuções automáticas possuem histórico');
select has_table('public', 'document_templates', 'modelos de documentos foram criados');
select has_table('public', 'document_generations', 'documentos gerados possuem versões e revisão');
select has_table('public', 'banking_integrations', 'preparação bancária foi criada');
select has_table('public', 'bank_file_batches', 'lotes bancários futuros possuem estrutura');

select has_function('public', 'run_portal_automations', array[]::text[], 'a equipe pode solicitar atualização manual');
select has_function('private', 'run_phase_four_automations', array['text','uuid'], 'o orquestrador interno existe');

select ok((select relrowsecurity from pg_class where oid='public.automation_runs'::regclass), 'histórico de automação usa RLS');
select ok((select relrowsecurity from pg_class where oid='public.document_generations'::regclass), 'documentos gerados usam RLS');
select ok((select relrowsecurity from pg_class where oid='public.banking_integrations'::regclass), 'dados bancários usam RLS');

select ok(not has_table_privilege('anon','public.automation_runs','select'), 'execuções não são públicas');
select ok(not has_table_privilege('anon','public.document_generations','select'), 'documentos gerados não são públicos');
select ok(not has_table_privilege('anon','public.banking_integrations','select'), 'preparação bancária não é pública');

select is((select schedule from cron.job where jobname='cafcm-refresh-operational-alerts' limit 1), '15 * * * *', 'a rotina é atualizada a cada hora');
select ok((select count(*) >= 3 from public.document_templates where is_active), 'modelos iniciais estão disponíveis sem dados operacionais fictícios');

select * from finish();
rollback;
