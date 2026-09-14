import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const subTabClickSearch = `  if (target.dataset.financeTab) {
    state.financeTab = target.dataset.financeTab;
    if (state.financeTab === "receivable") pushRoute("/faturamento");
    else if (state.financeTab === "payable") pushRoute("/despesas");
    else if (state.financeTab === "billets") pushRoute("/boletos");
    else pushRoute("/financeiro");
    return;
  }`;

const subTabClickReplace = `  if (target.dataset.financeTab) {
    state.financeTab = target.dataset.financeTab;
    if (state.financeTab === "receivable") pushRoute("/faturamento");
    else if (state.financeTab === "recurring") pushRoute("/faturamento/recorrencias");
    else if (state.financeTab === "payable") pushRoute("/despesas");
    else if (state.financeTab === "billets") pushRoute("/boletos");
    else if (state.financeTab === "bank") pushRoute("/banco");
    else pushRoute("/financeiro");
    return;
  }`;

content = content.replace(subTabClickSearch, subTabClickReplace);
fs.writeFileSync('src/app.js', content);
