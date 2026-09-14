import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const checksSearch = `  if (["admission", "contract", "leave", "termination", "accounting", "document", "document-edit", "document-requirement", "financial-charge", "payable", "payroll-competence"].includes(type)) {`;
const checksReplace = `  if (["admission", "contract", "leave", "termination", "accounting", "document", "document-edit", "document-requirement", "financial-charge", "payable", "payroll-competence", "recurring-charge"].includes(type)) {`;
content = content.replace(checksSearch, checksReplace);

const formMarkupSearch = `    if (type === "payroll-competence") {`;
const formMarkupReplace = `    if (type === "recurring-charge") {
      const item = await selectRecord("recurring_charges");
      const rules = { fixed: "Valor Fixo", per_apprentice: "Por Jovem Ativo", payroll_percentage: "% sobre Folha" };
      body = \`<form id="recurring-form" class="dialog-form wide-form">
        <input type="hidden" name="id" value="\${escapeHtml(item.id || "")}" />
        <div class="form-grid two-columns">
          <label>Empresa<select name="companyId" required><option value="">Selecione</option>\${references.companies.map((company) => \`<option value="\${company.id}" \${item.company_id === company.id ? "selected" : ""}>\${escapeHtml(company.name)}</option>\`).join("")}</select></label>
          <label>Descrição Padrão<input name="description" required maxlength="240" value="\${escapeHtml(item.description || "")}" /></label>
          <label>Regra de Valor<select name="valueRule">\${selectOptions(rules, item.value_rule || "fixed")}</select></label>
          <label>Valor Fixo (se aplicável)<input name="fixedAmount" type="number" min="0" step="0.01" value="\${escapeHtml(item.fixed_amount || "")}" /></label>
          <label>Dia Vencimento<input name="dueDay" type="number" min="1" max="31" required value="\${escapeHtml(item.due_day || "")}" /></label>
          <label>Ativa<select name="isActive">\${selectOptions({"true": "Sim", "false": "Não"}, item.is_active !== false ? "true" : "false")}</select></label>
          <label>Data Início<input name="startDate" type="date" required value="\${escapeHtml(item.start_date || "")}" /></label>
          <label>Data Fim<input name="endDate" type="date" value="\${escapeHtml(item.end_date || "")}" /></label>
        </div>
        <button class="btn btn-primary" type="submit">\${recordId ? "Salvar regra" : "Criar regra"}</button>
      </form>\`;
    }
    if (type === "payroll-competence") {`;
content = content.replace(formMarkupSearch, formMarkupReplace);

const formSubmitSearch = `    if (form.id === "payroll-form") {`;
const formSubmitReplace = `    if (form.id === "recurring-form") {
      const id = String(values.id || "");
      const payload = { company_id: values.companyId, description: String(values.description || "").trim(), value_rule: values.valueRule, fixed_amount: valueOrNull(values.fixedAmount), due_day: Number(values.dueDay), is_active: values.isActive === "true", start_date: values.startDate, end_date: values.endDate || null };
      if (payload.end_date && new Date(\`\${payload.end_date}T00:00:00\`) < new Date(\`\${payload.start_date}T00:00:00\`)) throw new Error("A data de término não pode ser anterior ao início.");
      const { error } = id ? await supabase.from("recurring_charges").update(payload).eq("id", id) : await supabase.from("recurring_charges").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error;
      closeOverlay(); showToast("Regra recorrente salva."); return renderView();
    }
    if (form.id === "payroll-form") {`;
content = content.replace(formSubmitSearch, formSubmitReplace);

fs.writeFileSync('src/app.js', content);
