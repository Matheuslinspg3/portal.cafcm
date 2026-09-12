# Portal CAFCM

Portal real de aprendizagem, acompanhamento e operação dos programas de jovens aprendizes. A CAFCM administra empresas, pessoas, cursos, aulas, atividades, matrículas, processos e tarefas; jovens estudam e registram seu progresso; empresas acompanham apenas os jovens vinculados a elas.

## Áreas da plataforma

- **Visão geral:** indicadores reais e pendências que exigem atenção.
- **Central de Esteiras:** processos comerciais, recrutamento, admissões, contratos, desligamentos, financeiro e departamento pessoal em quadros Kanban.
- **Tarefas e Pendências:** responsáveis, prioridades, prazos, vínculos com processos e listas de verificação.
- **Notificações:** avisos de atribuição e acesso direto ao item relacionado.
- **Automações:** alertas de prazo, tarefas deduplicadas, documentos com revisão, e-mails conferidos pela equipe e preparação da futura integração bancária.
- **Indicadores e relatórios:** painel executivo com dados reais, gargalos, tempo nas esteiras, exportação CSV, metas institucionais e registro de carga sem ranking de pessoas.
- **Empresas e Jovens:** cadastros, vínculos, acompanhamento e histórico.
- **Gestão de Vagas:** vagas, capacidade disponível, candidatos, currículos, encaminhamentos e retorno das empresas.
- **Admissões e Contratos:** conversão do aprovado em jovem, checklist personalizável, vigência e alertas de 90, 60, 30, 15 e 7 dias.
- **Desligamentos:** acompanhamento por etapas, documentos, contabilidade e encerramento auditável.
- **Departamento Pessoal:** painel do ciclo do jovem, férias, afastamentos e checklist completo de desligamento.
- **Financeiro:** controle manual por empresa e competência, com nota fiscal, boleto, vencimento, cobrança e recebimento.
- **Documentos:** arquivo digital privado, validade, arquivamento e pendências de recebimento e conferência.
- **Procedimentos:** acesso unificado às esteiras, tarefas, responsáveis e prazos das rotinas administrativas.
- **Acadêmico:** cursos, aulas, linhas de aprendizagem, atividades, matrículas e progresso.
- **Gestão:** pessoas, convites, credenciais e auditoria.

## Automações da Fase 4

A rotina é executada a cada hora e também pode ser atualizada manualmente por uma pessoa da equipe. Ela identifica vencimentos e falta de andamento em contratos, documentos, cobranças, recrutamento, desligamentos, férias, afastamentos e atividades acadêmicas. Os alertas são direcionados ao departamento responsável e não são duplicados a cada execução.

O Portal automatiza lembretes, protocolos, registros e tarefas derivadas. Aprovações, decisões financeiras, contratação, desligamento, envio externo e revisão final de documentos continuam dependendo de confirmação humana.

O cadastro Bradesco organiza convênio, carteira, leiaute e etapa da homologação. Ele não emite boleto nem transmite CNAB enquanto a CAFCM não receber do banco a documentação oficial, as credenciais e a confirmação de homologação.

## Permissões por departamento

As permissões da equipe CAFCM são aplicadas tanto na interface quanto no banco de dados. A Direção e Administração mantém acesso integral e é o único departamento autorizado a criar ou alterar contas internas da CAFCM.

| Departamento | Áreas principais | Nível de acesso |
| --- | --- | --- |
| Direção e Administração | Todas as áreas | Consulta e alteração |
| Gestão de Vagas | Empresas, vagas, candidatos e parcerias | Consulta e alteração |
| Coordenação | Jovens, cursos, aulas, atividades e matrículas | Consulta e alteração |
| Departamento Pessoal | Admissões, contratos, férias, afastamentos, desligamentos, documentos e contabilidade | Consulta e alteração |
| Recursos Humanos | Empresas, vagas, pessoas, convites e auditoria | Consulta e alteração; contas internas somente pela Direção |
| Financeiro | Empresas, contratos, documentos e contabilidade | Consulta de empresas e contratos; alteração de documentos e controles financeiros |

Todos os departamentos da equipe podem usar a Central de Esteiras, Tarefas e Notificações. Jovens e representantes de empresas continuam com os acessos externos já existentes.

## O que está neste repositório

- `src/app.js`: código-fonte da interface.
- `dist/`: arquivos estáticos publicados no navegador.
- `supabase/*.sql`: estrutura do banco, políticas RLS e evoluções do esquema.
- `supabase/migrations/`: migrações versionadas da operação por esteiras, tarefas e notificações.
- `supabase/functions/portal-admin/index.ts`: função administrativa protegida por perfil.
- `vercel.json`: build e roteamento prontos para Vercel.

## Publicar na Vercel

1. Na Vercel, escolha **Add New > Project** e importe `Matheuslinspg3/portal.cafcm`.
2. Mantenha a pasta raiz do projeto como `./`.
3. O `vercel.json` já define o comando `npm run build` e a saída `dist`.
4. Clique em **Deploy**. O domínio oficial do projeto é `https://portal.cafcm.org.br`.

Não é necessário cadastrar uma chave secreta na Vercel. O navegador usa somente a chave publicável do Supabase; operações privilegiadas permanecem na Edge Function e são validadas pelo usuário autenticado e pelo perfil CAFCM.

## Configuração obrigatória após a primeira publicação

Para que convites, confirmação de e-mail e recuperação de senha abram o novo domínio:

1. Abra o projeto `cyovnmnxzrfptyfrivdr` no Supabase.
2. Vá a **Authentication > URL Configuration**.
3. Defina **Site URL** como `https://portal.cafcm.org.br`.
4. Adicione essa mesma origem às **Redirect URLs**. Para previews, adicione também o padrão recomendado pela documentação do Supabase para a sua conta Vercel.
5. Reimplante a função `portal-admin` deste repositório para que os convites usem automaticamente a origem que fez a solicitação:

   ```bash
   npx supabase login
   npx supabase functions deploy portal-admin --project-ref cyovnmnxzrfptyfrivdr
   ```

A função aceita o domínio atual do Portal CAFCM, endereços locais de desenvolvimento e implantações HTTPS em `vercel.app`. Se usar domínio próprio, configure no Supabase o segredo `PORTAL_SITE_ORIGINS` com uma ou mais origens exatas separadas por vírgula, por exemplo:

```text
PORTAL_SITE_ORIGINS=https://portal.cafcm.org.br,https://portal-cafcm.vercel.app
```

O segredo `PORTAL_BOOTSTRAP_HASH` é necessário somente ao inicializar uma instalação nova e sem nenhum administrador. Ele deve conter o SHA-256 de uma chave inicial longa e aleatória. Na base CAFCM atual, o primeiro acesso já foi configurado.

## SMTP do Supabase com Resend

No Supabase, em **Authentication > SMTP Settings**:

- Host: `smtp.resend.com`
- Porta: `465` (SSL) ou `587` (STARTTLS)
- Username: `resend`
- Password: a API key criada no Resend
- Remetente: um endereço pertencente a um domínio verificado no Resend

Nunca salve a API key do Resend, a `service_role` do Supabase, senhas ou tokens neste repositório.

O SMTP acima atende convites, confirmação de conta e recuperação de senha. Para também enviar os e-mails operacionais preparados na Central de Automações, cadastre dois segredos nas Edge Functions do Supabase:

- `RESEND_API_KEY`: a chave de API do Resend.
- `PORTAL_EMAIL_FROM`: o remetente completo em um domínio verificado, por exemplo `Portal CAFCM <portal@cafcm.org.br>`.

A função `portal-automation` permanece segura sem esses segredos: documentos e alertas funcionam normalmente, e uma tentativa de e-mail retorna uma orientação de configuração sem expor credenciais.

## Desenvolvimento local

Requer Node.js 22 ou mais recente.

```bash
npm ci
npm run build
npm test
```

Sirva a pasta `dist` por HTTP. O portal usa a origem atual do navegador para montar links de autenticação, portanto funciona em produção e em ambiente local sem alterar o código-fonte.

## Banco de dados

Para uma instalação nova, aplique os arquivos SQL nesta ordem:

1. `supabase/schema.sql`
2. `supabase/invite_only_auth.sql`
3. `supabase/progress_course_context.sql`
4. `supabase/rls_hardening.sql`
5. `supabase/least_privilege_grants.sql`
6. `supabase/companies_courses_upgrade.sql`
7. `supabase/cnpj_alphanumeric.sql`
8. `supabase/people_audit_learning_paths.sql`
9. `supabase/migrations/20260909230300_phase_one_operations.sql`
10. `supabase/migrations/20260909232153_phase_one_foreign_key_indexes.sql`
11. `supabase/migrations/20260910042123_administrative_core.sql`
12. `supabase/migrations/20260910044617_operational_alerts.sql`
13. `supabase/migrations/20260910053000_standard_operational_workflows.sql`
14. `supabase/migrations/20260910150000_vacancy_management.sql`
15. `supabase/migrations/20260910154922_department_permissions.sql`
16. `supabase/migrations/20260910162500_administrative_foreign_key_indexes.sql`
17. `supabase/migrations/20260910171000_phase_two_operations.sql`
18. `supabase/migrations/20260910173500_phase_two_foreign_key_indexes.sql`
19. `supabase/migrations/20260910195458_phase_three_administration.sql`
20. `supabase/migrations/20260911030417_phase_four_automations.sql`
21. `supabase/migrations/20260911032000_phase_four_hardening.sql`
22. `supabase/migrations/20260911152640_phase_five_indicators.sql`

Os testes transacionais de banco estão em `supabase/tests/` e podem ser executados com `supabase test db` em um ambiente local do Supabase.

Revise os scripts antes de aplicá-los a uma base que já possui dados. A base CAFCM atual já recebeu essas evoluções; não execute novamente sem conferir o histórico de migrações.

## Segurança

- As tabelas expostas usam Row Level Security (RLS).
- A função administrativa confirma a sessão e o perfil `cafcm_admin` antes de operações privilegiadas.
- A função de automações exige JWT válido e permite documentos e e-mails somente à Direção, Departamento Pessoal e Financeiro.
- Indicadores e relatórios seguem as permissões de departamento; somente a Direção e Administração pode cadastrar metas. O registro de carga é individual para a equipe e a visão institucional não cria pontuação nem ranking.
- A equipe CAFCM recebe permissões por departamento no `app_metadata`, espelhadas no perfil e protegidas por políticas restritivas.
- Contas de empresa ficam vinculadas à empresa correspondente.
- Ações relevantes são registradas na auditoria.
- Arquivos `.env` e dados locais da Vercel são ignorados pelo Git.
