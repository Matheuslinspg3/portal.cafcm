import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const payrollRenderSearch = `async function renderPayroll(content) {
  content.innerHTML = \`\${pageHead("Folha e Ponto", "Controle operacional por competência (Ponto -> Ocorrências -> Preparação -> Relação).")}
    <section class="card"><div class="card-head"><div><h2>Competências de Folha</h2></div></div>\${emptyState("Funcionalidade em construção", "Os controles de competência da folha de pagamento estarão disponíveis em breve.")}</section>\`;
}`;

const payrollRenderReplace = `async function renderPayroll(content) {
  const [{ data: competences, error }, references] = await Promise.all([
    supabase.from("payroll_competences").select("*").order("month", { ascending: false }),
    loadOperationalReferences(),
  ]);
  if (error) throw error;
  const companyMap = new Map(references.companies.map(c => [c.id, c.name]));
  const payrollStatusLabels = { open: "Aberta", attendance: "Ponto", occurrences: "Ocorrências", preparation: "Preparação", conference: "Conferência", authorization: "Autorização", ready_for_finance: "Pronto p/ Financeiro", completed: "Concluída" };

  content.innerHTML = \`\${pageHead("Folha e Ponto", "Controle operacional por competência (Ponto -> Ocorrências -> Preparação -> Relação).", \`<button class="btn btn-primary" data-dialog="payroll-competence">\${icon("plus")} Nova competência</button>\`)}
    <section class="card">
      <div class="card-head"><div><h2>Competências</h2></div></div>
      \${competences && competences.length ? \`<div class="people-list">
        \${competences.map(comp => operationalRow(companyMap.get(comp.company_id) || "Empresa", \`Mês: \${comp.month}\`, payrollStatusLabels[comp.status] || comp.status, \`<button class="btn btn-small btn-secondary" data-edit-payroll="\${comp.id}">\${icon("edit")} Abrir</button>\`)).join("")}
      </div>\` : emptyState("Nenhuma competência", "Crie uma competência para iniciar a folha e o ponto.", \`<button class="btn btn-primary" data-dialog="payroll-competence">Nova competência</button>\`)}
    </section>\`;
}`;

content = content.replace(payrollRenderSearch, payrollRenderReplace);
fs.writeFileSync('src/app.js', content);
