import fs from 'fs';
let content = fs.readFileSync('README.md', 'utf8');

const readmeAddition = `

## Fluxo Operacional: Financeiro

O sistema financeiro foi unificado e agora controla faturamentos recorrentes e avulsos, além das contas a pagar (despesas), de forma integrada com as demais áreas.
Os handoffs ocorrem via tarefas no portal:
- Quando o DP conclui uma admissão, o Financeiro recebe uma notificação/tarefa de Handoff alertando para a criação das regras de faturamento e despesas contínuas relativas à nova admissão.
- Da mesma forma, rescisões concluídas disparam handoff para estancar o faturamento.
- Ao finalizar as competências de Folha de Ponto, o Financeiro é notificado com as devidas referências.

Os módulos englobam:
- **Lançamentos Avulsos** (\`financial_charges\`)
- **Regras de Faturamento Recorrente** (\`recurring_charges\`) com competências base (\`charge_batches\`)
- **Contas a Pagar/Despesas** (\`accounts_payable\`)
- Integração Bancária via sandbox (tabelas \`banking_integrations\` prontas para o fluxo futuro).
`;

content += readmeAddition;
fs.writeFileSync('README.md', content);
