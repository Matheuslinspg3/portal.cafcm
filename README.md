# Portal CAFCM

Portal real de aprendizagem e acompanhamento de jovens aprendizes. A CAFCM administra empresas, pessoas, cursos, aulas, linhas de aprendizagem, atividades e matrículas; jovens estudam e registram seu progresso; empresas visualizam apenas os jovens vinculados a elas.

## O que está neste repositório

- `src/app.js`: código-fonte da interface.
- `dist/`: arquivos estáticos publicados no navegador.
- `supabase/*.sql`: estrutura do banco, políticas RLS e evoluções do esquema.
- `supabase/functions/portal-admin/index.ts`: função administrativa protegida por perfil.
- `vercel.json`: build e roteamento prontos para Vercel.

## Publicar na Vercel

1. Na Vercel, escolha **Add New > Project** e importe `Matheuslinspg3/portal.cafcm`.
2. Mantenha a pasta raiz do projeto como `./`.
3. O `vercel.json` já define o comando `npm run build` e a saída `dist`.
4. Clique em **Deploy** e copie a URL de produção criada pela Vercel.

Não é necessário cadastrar uma chave secreta na Vercel. O navegador usa somente a chave publicável do Supabase; operações privilegiadas permanecem na Edge Function e são validadas pelo usuário autenticado e pelo perfil CAFCM.

## Configuração obrigatória após a primeira publicação

Para que convites, confirmação de e-mail e recuperação de senha abram o novo domínio:

1. Abra o projeto `cyovnmnxzrfptyfrivdr` no Supabase.
2. Vá a **Authentication > URL Configuration**.
3. Defina **Site URL** com a URL de produção da Vercel, sem caminho adicional.
4. Adicione essa mesma origem às **Redirect URLs**. Para previews, adicione também o padrão recomendado pela documentação do Supabase para a sua conta Vercel.
5. Reimplante a função `portal-admin` deste repositório para que os convites usem automaticamente a origem que fez a solicitação:

   ```bash
   npx supabase login
   npx supabase functions deploy portal-admin --project-ref cyovnmnxzrfptyfrivdr
   ```

A função aceita o domínio atual do Portal CAFCM, endereços locais de desenvolvimento e implantações HTTPS em `vercel.app`. Se usar domínio próprio, configure no Supabase o segredo `PORTAL_SITE_ORIGINS` com uma ou mais origens exatas separadas por vírgula, por exemplo:

```text
PORTAL_SITE_ORIGINS=https://portal.exemplo.org.br,https://portal-cafcm.vercel.app
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

Requer Node.js 20 ou mais recente.

```bash
npm ci
npm run build
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

Revise os scripts antes de aplicá-los a uma base que já possui dados. A base CAFCM atual já recebeu essas evoluções; não execute novamente sem conferir o histórico de migrações.

## Segurança

- As tabelas expostas usam Row Level Security (RLS).
- A função administrativa confirma a sessão e o perfil `cafcm_admin` antes de operações privilegiadas.
- Contas de empresa ficam vinculadas à empresa correspondente.
- Ações relevantes são registradas na auditoria.
- Arquivos `.env` e dados locais da Vercel são ignorados pelo Git.
