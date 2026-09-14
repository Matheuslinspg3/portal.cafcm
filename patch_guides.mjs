import fs from 'fs';
let content = fs.readFileSync('src/guides/catalog.mjs', 'utf8');

const tabsSearch = `const financeTabs = tabs('[aria-label="Áreas do financeiro"]', 'Contas a receber controla cobranças às empresas; Contas a pagar controla despesas; Calendário reúne os vencimentos. Feche o guia para trocar de aba e clique novamente em Como usar.');`;
const tabsReplace = `const financeTabs = tabs('[aria-label="Áreas do financeiro"]', 'O painel Financeiro consolida Lançamentos (A receber), Recorrências (Regras mensais), Despesas (A pagar), Boletos e integração bancária. Navegue nas abas superiores.');`;
content = content.replace(tabsSearch, tabsReplace);

const newGuides = `
  'finance:dashboard': guide('Financeiro · Visão Geral',
    intro('Visão Geral unificada', 'Aqui você encontra um resumo de toda a operação financeira: a faturar, a receber, inadimplência e o calendário de entradas/saídas.'),
    financeTabs,
    step('.metric-grid', 'Indicadores', 'Acompanhe métricas consolidadas dos faturamentos e recebimentos no mês.'),
    step('.finance-calendar', 'Calendário de Vencimentos', 'Visualize quando cada cobrança e despesa vencerá para equilibrar o caixa.')),
  'finance:recurring': guide('Financeiro · Faturamento Recorrente',
    intro('Regras Contínuas', 'Nesta aba você cria regras que definem o faturamento de cada empresa mês a mês, sem precisar recriar a cobrança do zero.'),
    financeTabs,
    create('recurring-charge', 'Nova regra recorrente', 'Defina empresa, descrição, valor (fixo, por jovem ou folha) e dia padrão de vencimento. As regras ativas aparecem na listagem.'),
    step('[data-preview-batch]', 'Geração em Lote', 'Ao virar o mês, selecione a competência e use a Prévia para analisar todos os lançamentos que serão gerados de uma só vez. A geração não duplica faturamentos já rodados.')),
`;

content = content.replace(
  `  'finance:receivable': guide('Financeiro · Contas a receber',`,
  newGuides + `  'finance:receivable': guide('Financeiro · Lançamentos',`
);

content = content.replace(
  `  'finance:payable': guide('Financeiro · Contas a pagar',`,
  `  'finance:payable': guide('Financeiro · Despesas',`
);

const subviewsSearch = `const subviews = { finance: ['financeTab', 'receivable'], vacancies: ['vacancyTab', 'overview'], documents: ['documentTab', 'files'], automations: ['automationTab', 'overview'] };`;
const subviewsReplace = `const subviews = { finance: ['financeTab', 'dashboard'], vacancies: ['vacancyTab', 'overview'], documents: ['documentTab', 'files'], automations: ['automationTab', 'overview'] };`;
content = content.replace(subviewsSearch, subviewsReplace);

fs.writeFileSync('src/guides/catalog.mjs', content);
