import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

// Updating renderPersonnel to include payroll and eSocial and the DP hub

const renderPersonnelSearch = `async function renderPersonnel(content) {
  const [admissionsResult, contractsResult, leavesResult, terminationsResult, requirementsResult, accountingResult] = await Promise.all([
    supabase.from("admission_cases").select("id,status,target_start_date"),
    supabase.from("contracts").select("id,status,end_date"),
    supabase.from("leave_records").select("id,status,leave_type,start_date,end_date"),
    supabase.from("termination_cases").select("id,status,effective_date"),
    supabase.from("document_requirements").select("id,status,due_date"),
    supabase.from("accounting_dispatches").select("id,status,due_at"),
  ]);`;

const renderPersonnelReplace = `async function renderPersonnel(content) {
  const [admissionsResult, contractsResult, leavesResult, terminationsResult, requirementsResult, accountingResult, payrollResult] = await Promise.all([
    supabase.from("admission_cases").select("id,status,target_start_date"),
    supabase.from("contracts").select("id,status,end_date"),
    supabase.from("leave_records").select("id,status,leave_type,start_date,end_date"),
    supabase.from("termination_cases").select("id,status,effective_date"),
    supabase.from("document_requirements").select("id,status,due_date"),
    supabase.from("accounting_dispatches").select("id,status,due_at"),
    supabase.from("payroll_competences").select("id,status,month"),
  ]);`;

content = content.replace(renderPersonnelSearch, renderPersonnelReplace);

const renderPersonnelStatsSearch = `  const openTerminations = terminations.filter((item) => !["completed", "cancelled"].includes(item.status));
  const pendingDocuments = requirements.filter((item) => item.status === "pending");
  const pendingAccounting = accounting.filter((item) => !["verified", "completed"].includes(item.status));`;
const renderPersonnelStatsReplace = `  const openTerminations = terminations.filter((item) => !["completed", "cancelled"].includes(item.status));
  const pendingDocuments = requirements.filter((item) => item.status === "pending");
  const pendingAccounting = accounting.filter((item) => !["verified", "completed"].includes(item.status));
  const payrolls = payrollResult?.data || [];
  const openPayrolls = payrolls.filter((item) => !["completed", "cancelled"].includes(item.status));`;
content = content.replace(renderPersonnelStatsSearch, renderPersonnelStatsReplace);

const renderPersonnelAttentionSearch = `  const attention = [
    pendingDocuments.length ? ["Documentos pendentes", \`\${pendingDocuments.length} documento(s) aguardando recebimento ou conferência\`, "documents"] : null,
    pendingAccounting.length ? ["Retornos da contabilidade", \`\${pendingAccounting.length} envio(s) ainda não concluído(s)\`, "accounting"] : null,
    dueContracts.length ? ["Contratos próximos do fim", \`\${dueContracts.length} contrato(s) vencem em até 90 dias\`, "contracts"] : null,
    openTerminations.length ? ["Desligamentos em andamento", \`\${openTerminations.length} processo(s) ainda aberto(s)\`, "terminations"] : null,
  ].filter(Boolean);
  const modules = [
    ["Admissões", \`\${openAdmissions.length} em andamento\`, "admissions", "tasks"],
    ["Contratos", \`\${activeContracts.length} vínculos ativos ou programados\`, "contracts", "calendar"],
    ["Férias e afastamentos", \`\${activeLeaves.length} registros em aberto\`, "leaves", "history"],
    ["Desligamentos", \`\${openTerminations.length} processos em andamento\`, "terminations", "alert"],
    ["Contabilidade", \`\${pendingAccounting.length} envios pendentes\`, "accounting", "mail"],
    ["Documentos", \`\${pendingDocuments.length} pendências documentais\`, "documents", "upload"],
  ].filter(([, , view]) => canAccessView(view));`;

const renderPersonnelAttentionReplace = `  const attention = [
    pendingDocuments.length ? ["Documentos pendentes", \`\${pendingDocuments.length} documento(s) aguardando recebimento ou conferência\`, "documents"] : null,
    pendingAccounting.length ? ["eSocial / Obrigações", \`\${pendingAccounting.length} envio(s) ainda não concluído(s)\`, "esocial"] : null,
    dueContracts.length ? ["Contratos próximos do fim", \`\${dueContracts.length} contrato(s) vencem em até 90 dias\`, "contracts"] : null,
    openTerminations.length ? ["Desligamentos em andamento", \`\${openTerminations.length} processo(s) ainda aberto(s)\`, "terminations"] : null,
    openPayrolls.length ? ["Folha e Ponto", \`\${openPayrolls.length} competência(s) em aberto\`, "payroll"] : null,
  ].filter(Boolean);
  const modules = [
    ["Admissões", \`\${openAdmissions.length} aguardando DP\`, "admissions", "tasks"],
    ["Contratos", \`\${activeContracts.length} vínculos ativos ou programados\`, "contracts", "calendar"],
    ["Folha e Ponto", \`\${openPayrolls.length} competências em aberto\`, "payroll", "mail"],
    ["Férias e afastamentos", \`\${activeLeaves.length} registros em aberto\`, "leaves", "history"],
    ["Desligamentos", \`\${openTerminations.length} processos em andamento\`, "terminations", "alert"],
    ["eSocial / Obrigações", \`\${pendingAccounting.length} envios pendentes\`, "esocial", "mail"],
    ["Documentos", \`\${pendingDocuments.length} pendências documentais\`, "documents", "upload"],
  ].filter(([, , view]) => canAccessView(view) || view === "payroll" || view === "esocial" || view === "hr");`;

content = content.replace(renderPersonnelAttentionSearch, renderPersonnelAttentionReplace);

const renderHrMissingSearch = `async function renderDocuments(content) {`;
const renderHrMissingReplace = `async function renderHr(content) {
  content.innerHTML = \`\${pageHead("Recursos Humanos", "Hub central de RH consolidando vagas, recrutamento, processos e empresas.")}
    <section class="administrative-hub-grid">
      <button class="administrative-module-card" data-nav="vacancies"><span>\${icon("kanban")}</span><div><strong>Recrutamento e Vagas</strong><small>Gerencie vagas e processos seletivos</small></div>\${icon("chevron")}</button>
      <button class="administrative-module-card" data-nav="apprentices"><span>\${icon("users")}</span><div><strong>Jovens</strong><small>Banco de jovens e histórico</small></div>\${icon("chevron")}</button>
      <button class="administrative-module-card" data-nav="companies"><span>\${icon("building")}</span><div><strong>Empresas</strong><small>Empresas parceiras e convênios</small></div>\${icon("chevron")}</button>
    </section>\`;
}

async function renderPayroll(content) {
  content.innerHTML = \`\${pageHead("Folha e Ponto", "Controle operacional por competência (Ponto -> Ocorrências -> Preparação -> Relação).")}
    <section class="card"><div class="card-head"><div><h2>Competências de Folha</h2></div></div>\${emptyState("Funcionalidade em construção", "Os controles de competência da folha de pagamento estarão disponíveis em breve.")}</section>\`;
}

async function renderEsocial(content) {
  // Consolidates old "accounting" to eSocial
  return renderAccounting(content);
}

async function renderDocuments(content) {`;

content = content.replace(renderHrMissingSearch, renderHrMissingReplace);

const routerMapSearch = `      personnel: renderPersonnel,
      finance: renderFinance,
      documents: renderDocuments,
      accounting: renderAccounting,`;
const routerMapReplace = `      personnel: renderPersonnel,
      hr: renderHr,
      payroll: renderPayroll,
      esocial: renderEsocial,
      finance: renderFinance,
      documents: renderDocuments,
      accounting: renderAccounting,`;

content = content.replace(routerMapSearch, routerMapReplace);

fs.writeFileSync('src/app.js', content);
