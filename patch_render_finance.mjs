import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const renderFinanceSearch = `async function renderFinance(content) {
  const [chargesResult, payablesResult, references] = await Promise.all([
    supabase.from("financial_charges").select("*").order("competence", { ascending: false }).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("accounts_payable").select("*").order("due_date", { ascending: true }),
    loadOperationalReferences(),
  ]);
  if (chargesResult.error || payablesResult.error) throw chargesResult.error || payablesResult.error;
  const charges = chargesResult.data || [];
  const payables = payablesResult.data || [];
  const canManage = hasPermission("finance.manage");`;

const renderFinanceReplace = `async function renderFinance(content) {
  const [chargesResult, payablesResult, recurringResult, references] = await Promise.all([
    supabase.from("financial_charges").select("*").order("competence", { ascending: false }).order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("accounts_payable").select("*").order("due_date", { ascending: true }),
    supabase.from("recurring_charges").select("*").order("created_at", { ascending: false }),
    loadOperationalReferences(),
  ]);
  if (chargesResult.error || payablesResult.error || recurringResult?.error) throw chargesResult.error || payablesResult.error || recurringResult?.error;
  const charges = chargesResult.data || [];
  const payables = payablesResult.data || [];
  const recurring = recurringResult?.data || [];
  const canManage = hasPermission("finance.manage");`;

content = content.replace(renderFinanceSearch, renderFinanceReplace);

const renderFinanceBodySearch = `  const hasChargeFilters = Boolean(state.financeSearch || state.financeStatus || state.financeCompany);
  const tabs = [["receivable", "Contas a receber", charges.length], ["payable", "Contas a pagar", payables.length], ["calendar", "Calendário", ""]];
  if (!tabs.some(([key]) => key === state.financeTab)) state.financeTab = "receivable";
  const action = !canManage ? "" : state.financeTab === "payable" ? \`<button class="btn btn-primary" data-dialog="payable">\${icon("plus")} Nova conta a pagar</button>\` : \`<button class="btn btn-primary" data-dialog="financial-charge">\${icon("plus")} Nova cobrança</button>\`;
  let body = "";
  if (state.financeTab === "receivable") {`;

const renderFinanceBodyReplace = `  const hasChargeFilters = Boolean(state.financeSearch || state.financeStatus || state.financeCompany);
  const tabs = [["dashboard", "Visão Geral", ""], ["receivable", "Lançamentos", charges.length], ["recurring", "Recorrências", recurring.length], ["payable", "Despesas", payables.length], ["billets", "Boletos", ""], ["bank", "Bradesco", ""]];
  if (!tabs.some(([key]) => key === state.financeTab)) state.financeTab = "dashboard";

  const action = !canManage ? "" :
    state.financeTab === "payable" ? \`<button class="btn btn-primary" data-dialog="payable">\${icon("plus")} Nova despesa</button>\` :
    state.financeTab === "recurring" ? \`<button class="btn btn-primary" data-dialog="recurring-charge">\${icon("plus")} Nova regra recorrente</button>\` :
    state.financeTab === "receivable" ? \`<button class="btn btn-primary" data-dialog="financial-charge">\${icon("plus")} Lançamento avulso</button>\` : "";

  let body = "";

  if (state.financeTab === "dashboard") {
    const toInvoice = charges.filter(c => c.status === "to_invoice").reduce((a, b) => a + Number(b.amount || 0), 0);
    const toReceive = openCharges.reduce((a, b) => a + Number(b.amount || 0), 0);
    const receivedAmount = received.reduce((a, b) => a + Number(b.paid_amount ?? b.amount ?? 0), 0);
    const overdueAmount = overdueCharges.reduce((a, b) => a + Number(b.amount || 0), 0);

    const attention = [];
    if (overdueCharges.length) attention.push([\`\${overdueCharges.length} cobranças vencidas\`, "Verifique pendências e faça contato", "receivable"]);
    if (overduePayables.length) attention.push([\`\${overduePayables.length} despesas vencidas\`, "Acesse contas a pagar", "payable"]);
    // Could add more attention items (e.g. handoffs)

    body = \`
      <section class="metric-grid">
        \${metric("A Faturar", formatMoney(toInvoice), "clock")}
        \${metric("A Receber", formatMoney(toReceive), "calendar")}
        \${metric("Recebido", formatMoney(receivedAmount), "check")}
        \${metric("Inadimplência", formatMoney(overdueAmount), "alert")}
      </section>
      \${financeCalendar(state.financeMonth, charges, payables, canManage)}
      <section class="card">
        <div class="card-head"><div><span class="eyebrow">Exige Atenção</span><h2>Pendências Financeiras</h2></div></div>
        \${attention.length ? \`<div class="people-list">\${attention.map(([t, d, v]) => operationalRow(t, d, "Pendente", \`<button class="btn btn-small btn-secondary" data-finance-tab="\${v}">Abrir</button>\`)).join("")}</div>\` : emptyState("Tudo em dia", "Nenhuma pendência crítica financeira.")}
      </section>
    \`;
  } else if (state.financeTab === "recurring") {
    body = \`<section class="card"><div class="people-list finance-list">\${recurring.length ? recurring.map((item) => { return \`<article class="person-row finance-row"><span class="avatar">\${icon("clock")}</span><div class="person-main"><strong>\${escapeHtml(companyMap.get(item.company_id) || "Empresa")}</strong><small>\${escapeHtml(item.description)} · Venc. \${item.due_day}</small></div><div class="finance-amount"><small>Regra</small><strong>\${item.value_rule === "fixed" ? formatMoney(item.fixed_amount) : item.value_rule === "per_apprentice" ? "Por Jovem" : "% Folha"}</strong></div><div class="person-access"><span class="status status-draft">\${item.is_active ? "Ativa" : "Inativa"}</span></div><div class="person-actions">\${canManage ? \`<button class="btn btn-small btn-secondary" data-edit-recurring="\${item.id}">\${icon("edit")} Alterar</button>\` : ""}</div></article>\`; }).join("") : emptyState("Nenhuma recorrência", "Crie regras de faturamento contínuo.", canManage ? \`<button class="btn btn-primary" data-dialog="recurring-charge">Nova regra</button>\` : "")}</div></section>\`;
  } else if (state.financeTab === "billets") {
    body = \`<section class="card"><div class="card-head"><div><h2>Visão unificada de Boletos</h2></div></div>\${emptyState("Gerenciamento de boletos", "Consolide recebimentos e baixas manuais nesta visão.")}</section>\`;
  } else if (state.financeTab === "bank") {
    body = \`<section class="card"><div class="card-head"><div><h2>Integração Bancária</h2></div></div>\${emptyState("Ambiente Sandbox", "O ambiente de integração encontra-se em testes.")}</section>\`;
  } else if (state.financeTab === "receivable") {`;

content = content.replace(renderFinanceBodySearch, renderFinanceBodyReplace);

// The `else { body = financeCalendar... }` at the end of the original logic needs to be removed since we added calendar to dashboard.
const oldElseSearch = `  } else {
    body = financeCalendar(state.financeMonth, charges, payables, canManage);
  }
  content.innerHTML = \`\${pageHead("Financeiro", "Controle manual de cobranças, contas a pagar, calendário e lembretes de vencimento em uma única rotina.", action)}<nav class="operations-tabs" aria-label="Áreas do financeiro">\${tabs.map(([key, label, count]) => \`<button class="\${state.financeTab === key ? "active" : ""}" data-finance-tab="\${key}">\${label}\${count !== "" ? \`<span>\${count}</span>\` : ""}</button>\`).join("")}</nav>\${body}\`;`;

const oldElseReplace = `  }
  content.innerHTML = \`\${pageHead("Financeiro", "Controles financeiros, faturamentos, despesas e relatórios consolidados em um só lugar.", action)}<nav class="operations-tabs" aria-label="Áreas do financeiro">\${tabs.map(([key, label, count]) => \`<button class="\${state.financeTab === key ? "active" : ""}" data-finance-tab="\${key}">\${label}\${count !== "" ? \`<span>\${count}</span>\` : ""}</button>\`).join("")}</nav>\${body}\`;`;

content = content.replace(oldElseSearch, oldElseReplace);

fs.writeFileSync('src/app.js', content);
