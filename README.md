# Portal CAFCM

Portal real de aprendizagem, acompanhamento e operação dos programas de jovens aprendizes. A CAFCM administra empresas, pessoas, cursos, aulas, atividades, matrículas, processos e tarefas; jovens estudam e registram seu progresso; empresas acompanham apenas os jovens vinculados a elas.

## Áreas da plataforma

- **Visão geral:** indicadores reais e pendências que exigem atenção.
- **Central de Esteiras:** processos comerciais, recrutamento, admissões, contratos, desligamentos, financeiro e departamento pessoal em quadros Kanban.
- **Tarefas e Pendências:** responsáveis, prioridades, prazos, vínculos com processos e listas de verificação.
- **Notificações:** avisos de atribuição e acesso direto ao item relacionado.
- **Empresas e Jovens:** cadastros, vínculos, acompanhamento e histórico.
- **Gestão de Vagas:** vagas, capacidade disponível, candidatos, currículos, encaminhamentos e retorno das empresas.
- **Admissões e Contratos:** conversão do aprovado em jovem, checklist personalizável, vigência e alertas de 90, 60, 30, 15 e 7 dias.
- **Desligamentos:** acompanhamento por etapas, documentos, contabilidade e encerramento auditável.
- **Acadêmico:** cursos, aulas, linhas de aprendizagem, atividades, matrículas e progresso.
- **Gestão:** pessoas, convites, credenciais e auditoria.

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

O teste transacional de banco está em `supabase/tests/phase_two_operations.test.sql` e pode ser executado com `supabase test db` em um ambiente local do Supabase.

Revise os scripts antes de aplicá-los a uma base que já possui dados. A base CAFCM atual já recebeu essas evoluções; não execute novamente sem conferir o histórico de migrações.

## Segurança

- As tabelas expostas usam Row Level Security (RLS).
- A função administrativa confirma a sessão e o perfil `cafcm_admin` antes de operações privilegiadas.
- A equipe CAFCM recebe permissões por departamento no `app_metadata`, espelhadas no perfil e protegidas por políticas restritivas.
- Contas de empresa ficam vinculadas à empresa correspondente.
- Ações relevantes são registradas na auditoria.
- Arquivos `.env` e dados locais da Vercel são ignorados pelo Git.
