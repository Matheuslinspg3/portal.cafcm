import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const oldFormSearch = `          <label>Empresa<select name="companyId" required><option value="">Selecione</option>\${references.companies.map((company) => \`<option value="\${company.id}" \${item.company_id === company.id ? "selected" : ""}>\${escapeHtml(company.name)}</option>\`).join("")}</select></label>`;
const newFormReplace = `          <label>Empresa (Faturamento)<select name="companyId"><option value="">Nenhuma (se for Despesa)</option>\${references.companies.map((company) => \`<option value="\${company.id}" \${item.company_id === company.id ? "selected" : ""}>\${escapeHtml(company.name)}</option>\`).join("")}</select></label>
          <label>Fornecedor (Despesa fixada)<input name="supplierName" maxlength="200" value="\${escapeHtml(item.supplier_name || "")}" /></label>
          <label>Tipo<select name="chargeType">\${selectOptions({receivable: "Faturamento (Receber)", payable: "Custo Fixo (Pagar)"}, item.charge_type || "receivable")}</select></label>`;
content = content.replace(oldFormSearch, newFormReplace);

const oldSubmitSearch = `const payload = { company_id: values.companyId, description: String(values.description || "").trim(), value_rule: values.valueRule, fixed_amount: valueOrNull(values.fixedAmount), due_day: Number(values.dueDay), is_active: values.isActive === "true", start_date: values.startDate, end_date: values.endDate || null };`;
const newSubmitReplace = `const payload = { charge_type: values.chargeType, company_id: values.companyId || null, supplier_name: valueOrNull(values.supplierName), description: String(values.description || "").trim(), value_rule: values.valueRule, fixed_amount: valueOrNull(values.fixedAmount), due_day: Number(values.dueDay), is_active: values.isActive === "true", start_date: values.startDate, end_date: values.endDate || null };`;
content = content.replace(oldSubmitSearch, newSubmitReplace);

fs.writeFileSync('src/app.js', content);
