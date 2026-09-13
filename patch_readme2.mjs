import fs from 'fs';
let content = fs.readFileSync('README.md', 'utf8');

const readmeAddition = `

## Fluxo Operacional: RH → DP → Financeiro

A operação segue o princípio de "Uma Empresa, Um Candidato, Um Jovem", não havendo duplicidades no cadastro ou nas admissões.

- **RH (Recursos Humanos)**: Administra o funil de seleção (\`/vagas/processos-seletivos\`). Quando o candidato atinge o status "Aprovado", o RH utiliza a opção "Converter / Editar" para confirmar a admissão. Essa ação transfere os dados do candidato para um novo perfil de Jovem, envia o convite e cria **uma única admissão**.
- **DP (Departamento Pessoal)**: Recebe automaticamente a admissão aberta em \`/admissoes\`. É gerado o checklist operacional (documentos, contrato, calendário). O DP trabalha os checklists. Ao finalizar, o encerramento das admissões e o final dos contratos encaminham automaticamente as pendências (via status ou eventos) para a conferência final e cobranças na aba Financeiro, sem redigitação de dados.
- O mesmo vale para \`/rescisoes\` e processos do \`eSocial\`. Tudo flui da alteração de status/ações confirmadas pelas áreas para as filas apropriadas de notificação e pendência.
`;

content += readmeAddition;
fs.writeFileSync('README.md', content);
