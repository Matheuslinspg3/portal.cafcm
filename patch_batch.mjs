import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const eventSearch = `  if (target.dataset.documentTab) {`;
const eventReplace = `  if (target.hasAttribute("data-preview-batch")) {
    const competenceInput = document.getElementById("batch-competence");
    if (!competenceInput || !competenceInput.value) return showToast("Selecione a competência para a prévia.", "error");
    return openBatchPreview(competenceInput.value);
  }
  if (target.dataset.documentTab) {`;

content = content.replace(eventSearch, eventReplace);

const batchLogic = `
async function openBatchPreview(month) {
  const competenceDate = \`\${month}-01\`;
  const { data: recurring, error } = await supabase.from("recurring_charges").select("*").eq("is_active", true).lte("start_date", \`\${month}-31\`);
  if (error) {
    showToast("Não foi possível carregar as regras.", "error");
    return;
  }
  const activeRules = recurring.filter(r => !r.end_date || r.end_date >= competenceDate);
  if (!activeRules.length) return showToast("Nenhuma regra ativa para esta competência.", "error");

  const dialog = document.createElement("dialog");
  dialog.className = "dialog slide-dialog";
  dialog.innerHTML = \`<div class="dialog-content">
    <div class="dialog-head"><h2>Prévia do Lote: \${formatMonth(competenceDate)}</h2><button type="button" class="icon-btn" data-close-dialog aria-label="Fechar">\${icon("close")}</button></div>
    <div class="dialog-body">
      <p>Verifique os lançamentos que serão gerados. Eles serão salvos como rascunhos para emissão posterior.</p>
      <form id="batch-generate-form">
        <input type="hidden" name="competence" value="\${competenceDate}">
        <div class="people-list">
          \${activeRules.map((rule, idx) => \`
            <div class="card" style="padding: 1rem; margin-bottom: 0.5rem; display: grid; gap: 0.5rem;">
               <input type="hidden" name="rule-\${idx}-id" value="\${rule.id}">
               <input type="hidden" name="rule-\${idx}-type" value="\${rule.charge_type}">
               <label><input type="checkbox" name="rule-\${idx}-include" checked> <strong>Incluir \${escapeHtml(rule.description)}</strong></label>
               <div style="display: flex; gap: 1rem;">
                 <label>Vencimento (Dia \${rule.due_day})<input type="date" name="rule-\${idx}-due" value="\${month}-\${String(rule.due_day).padStart(2, '0')}" required></label>
                 <label>Valor (R$)<input type="number" step="0.01" name="rule-\${idx}-amount" value="\${rule.value_rule === 'fixed' ? rule.fixed_amount : 0}" required></label>
               </div>
            </div>
          \`).join("")}
        </div>
        <button class="btn btn-primary btn-block" style="margin-top: 1rem;">Gerar Lançamentos</button>
      </form>
    </div>
  </div>\`;
  document.getElementById("overlay-root").appendChild(dialog);
  dialog.showModal();
}

app.addEventListener("submit", async (event) => {
  if (event.target.id === "batch-generate-form") {
    event.preventDefault();
    setBusy(event.target, true);
    try {
      const formData = new FormData(event.target);
      const competence = formData.get("competence");
      let count = 0;
      let i = 0;

      const { data: batch, error: batchError } = await supabase.from("charge_batches").insert({ competence, status: "generated" }).select("id").single();
      if (batchError && batchError.code !== "23505") throw batchError; // 23505 is unique violation, meaning batch exists

      // If batch exists, fetch its ID
      let batchId = batch?.id;
      if (!batchId) {
         const { data: extBatch } = await supabase.from("charge_batches").select("id").eq("competence", competence).single();
         batchId = extBatch?.id;
      }

      while (formData.has(\`rule-\${i}-id\`)) {
        const include = formData.get(\`rule-\${i}-include\`);
        if (include) {
          const ruleId = formData.get(\`rule-\${i}-id\`);
          const chargeType = formData.get(\`rule-\${i}-type\`);
          const amount = formData.get(\`rule-\${i}-amount\`);
          const due = formData.get(\`rule-\${i}-due\`);

          const { data: rule } = await supabase.from("recurring_charges").select("company_id, supplier_name, description").eq("id", ruleId).single();

          if (chargeType === "receivable") {
            const { error: insertErr } = await supabase.from("financial_charges").insert({
              recurring_charge_id: ruleId, competence, batch_id: batchId, company_id: rule.company_id, description: rule.description, amount, due_date: due, status: "to_invoice"
            });
            // ignore unique constraints (already generated)
            if (!insertErr) count++;
          } else {
            const { error: insertErr } = await supabase.from("accounts_payable").insert({
              recurring_charge_id: ruleId, competence, batch_id: batchId, supplier_name: rule.supplier_name, category: "Custo Fixo", description: rule.description, amount, due_date: due, status: "pending"
            });
            if (!insertErr) count++;
          }
        }
        i++;
      }

      closeOverlay();
      showToast(\`Lote processado. \${count} novos lançamentos gerados.\`);
      renderView();
    } catch (e) {
      showToast(friendlyError(e), "error");
    } finally {
      setBusy(event.target, false);
    }
  }
});
`;

content += batchLogic;
fs.writeFileSync('src/app.js', content);
