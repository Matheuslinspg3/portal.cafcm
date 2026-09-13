import fs from 'fs';
let content = fs.readFileSync('README.md', 'utf8');

const readmeAddition = `
## Arquitetura de Navegação

A navegação foi recentemente refatorada para utilizar um roteador no lado do cliente (Client-Side Router) que suporta a **History API**. Isso permite:

- **URLs reais e compartilháveis**: Cada aba e subaba possui uma URL única (ex: \`/vagas\`, \`/vagas/candidatos\`).
- **Deep Links**: Links diretos para itens específicos (ex: \`/cursos?id=abc\`).
- **Sidebar Dinâmica e Responsiva**: Componente de sidebar extraído, com suporte a visualização compacta (salva via \`localStorage\`), acordeões (accordion) com agrupamento de opções, e expansão automática baseada na rota ativa.
- **Histórico do Navegador**: As setas de "Voltar" e "Avançar" do navegador resolvem a aba corretamente utilizando os eventos \`popstate\`.
- **Roteamento Desacoplado**: O mapa de rotas encontra-se em \`src/router/routes.mjs\`, e a lógica do roteador em \`src/router/router.mjs\`. Para adicionar uma rota futura, basta incluí-la no \`routeMap\` e, se necessário, mapeá-la de volta via \`viewToUrl\`.
`;

content += readmeAddition;
fs.writeFileSync('README.md', content);
