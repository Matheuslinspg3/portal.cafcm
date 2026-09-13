import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const oldSuccessSearch = `      state.view = canAccessView("admissions") ? "admissions" : "vacancies";
      state.vacancyTab = "applications";
      return renderPortal();`;
const newSuccessReplace = `      if (canAccessView("admissions")) {
        pushRoute("/admissoes");
      } else {
        pushRoute("/vagas/processos-seletivos");
      }
      return;`;

content = content.replace(oldSuccessSearch, newSuccessReplace);

// Let's add a button in renderVacancies to trigger candidate conversion when they are approved.
// First look at how "hired" / conversion is triggered from applications list.
const applicationRowSearch = `statusLabels[item.status] || item.status, \`<button class="btn btn-small btn-secondary" data-edit-application="\${item.id}">\${icon("edit")} Atualizar</button>\`)).join("")`;
const applicationRowReplace = `statusLabels[item.status] || item.status, \`<button class="btn btn-small btn-secondary" data-edit-application="\${item.id}">\${icon("edit")} \${item.status === "approved" ? "Converter / Editar" : "Atualizar"}</button>\`)).join("")`;
content = content.replace(applicationRowSearch, applicationRowReplace);

fs.writeFileSync('src/app.js', content);
