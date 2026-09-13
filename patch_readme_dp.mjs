import fs from 'fs';
let content = fs.readFileSync('README.md', 'utf8');

const readmeAddition = `

## Fluxo Operacional: Folha e Ponto

A operação da folha é organizada por "competência" (\`/folha\`).
- DP abre uma competência referenciando um mês e uma empresa.
- As ausências e ocorrências são registradas associadas a essa competência.
- O DP processa a folha (Ponto -> Ocorrências -> Preparação -> Conferência -> Autorização).
- Ao ser marcada como "Concluída", a relação de líquidos fica à disposição para o Financeiro realizar os pagamentos via "handoff", sem precisar recalcular valores.
`;

content += readmeAddition;
fs.writeFileSync('README.md', content);
