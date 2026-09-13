import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const oldCheckSearch = `  if (["admission", "contract", "leave", "termination", "accounting", "document", "document-edit", "document-requirement", "financial-charge", "payable"].includes(type)) {`;
const newCheckReplace = `  if (["admission", "contract", "leave", "termination", "accounting", "document", "document-edit", "document-requirement", "financial-charge", "payable", "payroll-competence"].includes(type)) {`;
content = content.replace(oldCheckSearch, newCheckReplace);


const formLogicSearch = `    if (type === "contract") {`;
const formLogicReplace = `    if (type === "payroll-competence") {
      const item = await selectRecord("payroll_competences");
      const payrollStatusLabels = { open: "Aberta", attendance: "Ponto", occurrences: "Ocorrências", preparation: "Preparação", conference: "Conferência", authorization: "Autorização", ready_for_finance: "Pronto p/ Financeiro", completed: "Concluída" };
      body = \`<form id="payroll-form" class="dialog-form wide-form">
        <input type="hidden" name="id" value="\${escapeHtml(item.id || "")}" />
        <div class="form-grid two-columns">
          <label>Empresa<select name="companyId" required><option value="">Selecione</option>\${references.companies.map((company) => \`<option value="\${company.id}" \${item.company_id === company.id ? "selected" : ""}>\${escapeHtml(company.name)}</option>\`).join("")}</select></label>
          <label>Competência (AAAA-MM)<input name="month" required pattern="\\\\d{4}-\\\\d{2}" placeholder="Ex: 2026-09" value="\${escapeHtml(item.month || "")}" /></label>
          <label>Status<select name="status">\${selectOptions(payrollStatusLabels, item.status || "open")}</select></label>
        </div>
        <label>Observações<textarea name="notes" rows="4">\${escapeHtml(item.notes || "")}</textarea></label>
        <button class="btn btn-primary" type="submit">\${recordId ? "Salvar competência" : "Criar competência"}</button>
      </form>\`;
    }
    if (type === "contract") {`;

content = content.replace(formLogicSearch, formLogicReplace);

const formSubmitSearch = `    if (form.id === "contract-form") {`;
const formSubmitReplace = `    if (form.id === "payroll-form") {
      const id = String(values.id || "");
      const payload = { company_id: values.companyId, month: values.month, status: values.status || "open", notes: String(values.notes || "").trim() };
      const { error } = id ? await supabase.from("payroll_competences").update(payload).eq("id", id) : await supabase.from("payroll_competences").insert({ ...payload, created_by: state.profile.id });
      if (error) throw error;
      closeOverlay(); showToast("Competência salva."); return renderView();
    }
    if (form.id === "contract-form") {`;

content = content.replace(formSubmitSearch, formSubmitReplace);

fs.writeFileSync('src/app.js', content);
