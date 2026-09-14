import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const actionsSearch = `const status = isLate ? "Vencido — atualizar" : financialStatusLabels[item.status] || item.status; return \`<article class="person-row finance-row"><span class="avatar">\${icon(isLate ? "alert" : item.status === "paid" ? "check" : "calendar")}</span><div class="person-main"><strong>\${escapeHtml(companyMap.get(item.company_id) || "Empresa")}</strong><small>\${escapeHtml(item.description)} · \${escapeHtml(detail)}</small></div><div class="finance-amount"><small>Valor</small><strong>\${formatMoney(item.amount)}</strong></div><div class="person-access"><span class="status status-draft">\${escapeHtml(status)}</span></div><div class="person-actions">\${canManage ? \`<button class="btn btn-small btn-secondary" data-edit-financial-charge="\${item.id}">\${icon("edit")} Alterar</button>\` : ""}</div></article>\`; }).join("") : emptyState("Nenhuma cobrança encontrada", hasChargeFilters ? "Altere os filtros para localizar outro registro." : "Cadastre a primeira cobrança para iniciar o controle financeiro.", canManage ? \`<button class="btn btn-primary" data-dialog="financial-charge">Nova cobrança</button>\` : "")}</div></section>\`;
  } else if (state.financeTab === "payable") {`;

const actionsReplace = `const status = isLate ? "Vencido — atualizar" : financialStatusLabels[item.status] || item.status; return \`<article class="person-row finance-row"><span class="avatar">\${icon(isLate ? "alert" : item.status === "paid" ? "check" : "calendar")}</span><div class="person-main"><strong>\${escapeHtml(companyMap.get(item.company_id) || "Empresa")}</strong><small>\${escapeHtml(item.description)} · \${escapeHtml(detail)}</small></div><div class="finance-amount"><small>Valor</small><strong>\${formatMoney(item.amount)}</strong></div><div class="person-access"><span class="status status-draft">\${escapeHtml(status)}</span></div><div class="person-actions">\${canManage ? \`\${item.status !== "paid" ? \`<button class="btn btn-small btn-primary" data-pay-charge="\${item.id}">Pagar</button>\` : ""}<button class="btn btn-small btn-secondary" data-edit-financial-charge="\${item.id}">\${icon("edit")} Alterar</button>\` : ""}</div></article>\`; }).join("") : emptyState("Nenhuma cobrança encontrada", hasChargeFilters ? "Altere os filtros para localizar outro registro." : "Cadastre a primeira cobrança para iniciar o controle financeiro.", canManage ? \`<button class="btn btn-primary" data-dialog="financial-charge">Nova cobrança</button>\` : "")}</div></section>\`;
  } else if (state.financeTab === "payable") {`;

content = content.replace(actionsSearch, actionsReplace);

const payablesSearch = `return \`<article class="person-row finance-row"><span class="avatar">\${icon(late ? "alert" : item.status === "paid" ? "check" : "calendar")}</span><div class="person-main"><strong>\${escapeHtml(item.supplier_name)}</strong><small>\${escapeHtml(item.description)} · \${detail}</small></div><div class="finance-amount"><small>Valor</small><strong>\${formatMoney(item.amount)}</strong></div><div class="person-access"><span class="status status-draft">\${escapeHtml(late ? "Vencida — atualizar" : payableStatusLabels[item.status] || item.status)}</span></div><div class="person-actions">\${canManage ? \`<button class="btn btn-small btn-secondary" data-edit-payable="\${item.id}">\${icon("edit")} Alterar</button>\` : ""}</div></article>\`; }).join("") : emptyState("Nenhuma conta a pagar encontrada", "Cadastre fornecedores, despesas, vencimentos e responsáveis para manter os avisos centralizados.", canManage ? \`<button class="btn btn-primary" data-dialog="payable">Nova conta a pagar</button>\` : "")}</div></section>\`;
  } else if (state.financeTab === "recurring") {`;

const payablesReplace = `return \`<article class="person-row finance-row"><span class="avatar">\${icon(late ? "alert" : item.status === "paid" ? "check" : "calendar")}</span><div class="person-main"><strong>\${escapeHtml(item.supplier_name)}</strong><small>\${escapeHtml(item.description)} · \${detail}</small></div><div class="finance-amount"><small>Valor</small><strong>\${formatMoney(item.amount)}</strong></div><div class="person-access"><span class="status status-draft">\${escapeHtml(late ? "Vencida — atualizar" : payableStatusLabels[item.status] || item.status)}</span></div><div class="person-actions">\${canManage ? \`\${item.status !== "paid" ? \`<button class="btn btn-small btn-primary" data-pay-payable="\${item.id}">Pagar</button>\` : ""}<button class="btn btn-small btn-secondary" data-edit-payable="\${item.id}">\${icon("edit")} Alterar</button>\` : ""}</div></article>\`; }).join("") : emptyState("Nenhuma conta a pagar encontrada", "Cadastre fornecedores, despesas, vencimentos e responsáveis para manter os avisos centralizados.", canManage ? \`<button class="btn btn-primary" data-dialog="payable">Nova conta a pagar</button>\` : "")}</div></section>\`;
  } else if (state.financeTab === "recurring") {`;

content = content.replace(payablesSearch, payablesReplace);

const handlersSearch = `  if (target.hasAttribute("data-preview-batch")) {`;
const handlersReplace = `  if (target.hasAttribute("data-pay-charge")) {
    const id = target.getAttribute("data-pay-charge");
    const amount = window.prompt("Digite o valor pago:");
    if (!amount) return;
    const { error } = await supabase.from("financial_charges").update({ status: "paid", paid_at: new Date().toISOString(), paid_amount: amount }).eq("id", id);
    if (error) return showToast(friendlyError(error), "error");
    showToast("Cobrança marcada como paga.");
    return renderView();
  }
  if (target.hasAttribute("data-pay-payable")) {
    const id = target.getAttribute("data-pay-payable");
    const amount = window.prompt("Digite o valor pago:");
    if (!amount) return;
    const { error } = await supabase.from("accounts_payable").update({ status: "paid", paid_at: new Date().toISOString(), paid_amount: amount }).eq("id", id);
    if (error) return showToast(friendlyError(error), "error");
    showToast("Despesa marcada como paga.");
    return renderView();
  }
  if (target.hasAttribute("data-preview-batch")) {`;

content = content.replace(handlersSearch, handlersReplace);

fs.writeFileSync('src/app.js', content);
