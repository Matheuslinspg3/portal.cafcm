import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const attentionSearch = `    const attention = [];
    if (overdueCharges.length) attention.push([\`\${overdueCharges.length} cobranças vencidas\`, "Verifique pendências e faça contato", "receivable"]);
    if (overduePayables.length) attention.push([\`\${overduePayables.length} despesas vencidas\`, "Acesse contas a pagar", "payable"]);
    // Could add more attention items (e.g. handoffs)`;

const attentionReplace = `    // Fetch handoff tasks dynamically for the Finance attention area
    const { data: financeTasks } = await supabase.from("tasks").select("id,title,description,status").eq("category", "finance").not("status", "in", "(completed,cancelled)");

    const attention = [];
    if (overdueCharges.length) attention.push([\`\${overdueCharges.length} cobranças vencidas\`, "Verifique pendências e faça contato", "receivable"]);
    if (overduePayables.length) attention.push([\`\${overduePayables.length} despesas vencidas\`, "Acesse contas a pagar", "payable"]);

    if (financeTasks && financeTasks.length) {
      attention.push([\`\${financeTasks.length} solicitações de handoff pendentes\`, "Acesse a aba de Tarefas para analisar as atualizações de Admissão, Folha e Rescisão repassadas pelo DP.", "tasks"]);
    }`;

content = content.replace(attentionSearch, attentionReplace);
fs.writeFileSync('src/app.js', content);
