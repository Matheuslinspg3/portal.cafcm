import fs from 'fs';
let content = fs.readFileSync('src/router/routes.mjs', 'utf8');

const financeRouteSearch = `  "/financeiro": { view: "finance", title: "Financeiro", tab: "receivable" },
  "/faturamento": { view: "finance", title: "Faturamento", tab: "receivable" },
  "/despesas": { view: "finance", title: "Despesas", tab: "payable" },
  "/boletos": { view: "finance", title: "Boletos", tab: "billets" },`;

const financeRouteReplace = `  "/financeiro": { view: "finance", title: "Financeiro", tab: "dashboard" },
  "/faturamento": { view: "finance", title: "Faturamento", tab: "receivable" },
  "/faturamento/recorrencias": { view: "finance", title: "Faturamento Recorrente", tab: "recurring" },
  "/despesas": { view: "finance", title: "Despesas", tab: "payable" },
  "/boletos": { view: "finance", title: "Boletos e Recebimentos", tab: "billets" },
  "/banco": { view: "finance", title: "Integração Bancária", tab: "bank" },`;

content = content.replace(financeRouteSearch, financeRouteReplace);
fs.writeFileSync('src/router/routes.mjs', content);
