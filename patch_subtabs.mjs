import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const tabsSearch = `
  if (target.dataset.vacancyTab) {
    state.vacancyTab = target.dataset.vacancyTab;
    state.vacancyStatus = "";
    return renderView();
  }
  if (target.dataset.documentTab) {
    state.documentTab = target.dataset.documentTab;
    return renderView();
  }
  if (target.dataset.notificationFilter) {
    state.notificationFilter = target.dataset.notificationFilter;
    return renderView();
  }
  if (target.dataset.automationTab) {
    state.automationTab = target.dataset.automationTab;
    return renderView();
  }
  if (target.dataset.financeTab) {
    state.financeTab = target.dataset.financeTab;
    return renderView();
  }`;

const tabsReplace = `
  if (target.dataset.vacancyTab) {
    state.vacancyTab = target.dataset.vacancyTab;
    state.vacancyStatus = "";
    if (state.vacancyTab === "candidates") pushRoute("/vagas/candidatos");
    else if (state.vacancyTab === "processes") pushRoute("/vagas/processos-seletivos");
    else pushRoute("/vagas");
    return;
  }
  if (target.dataset.documentTab) {
    state.documentTab = target.dataset.documentTab;
    if (state.documentTab === "templates") pushRoute("/documentos/modelos");
    else pushRoute("/documentos");
    return;
  }
  if (target.dataset.notificationFilter) {
    state.notificationFilter = target.dataset.notificationFilter;
    // not routed currently
    return renderView();
  }
  if (target.dataset.automationTab) {
    state.automationTab = target.dataset.automationTab;
    if (state.automationTab === "history") pushRoute("/automacoes/historico");
    else pushRoute("/automacoes");
    return;
  }
  if (target.dataset.financeTab) {
    state.financeTab = target.dataset.financeTab;
    if (state.financeTab === "receivable") pushRoute("/faturamento");
    else if (state.financeTab === "payable") pushRoute("/despesas");
    else if (state.financeTab === "billets") pushRoute("/boletos");
    else pushRoute("/financeiro");
    return;
  }`;

content = content.replace(tabsSearch, tabsReplace);
fs.writeFileSync('src/app.js', content);
