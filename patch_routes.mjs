import fs from 'fs';
let content = fs.readFileSync('src/router/routes.mjs', 'utf8');

const hrAliasSearch = `  // Administrativo
  "/dp": { view: "personnel", title: "Departamento Pessoal" },
  "/rh": { view: "hr", title: "Recursos Humanos" }, // Aliases/Preparatory`;

const hrAliasReplace = `  // Administrativo
  "/dp": { view: "personnel", title: "Departamento Pessoal" },
  "/rh": { view: "hr", title: "Recursos Humanos" },
  "/folha": { view: "payroll", title: "Folha e Ponto" },
  "/esocial": { view: "esocial", title: "eSocial / Obrigações" },`;

content = content.replace(hrAliasSearch, hrAliasReplace);

const viewToUrlSearch = `  "personnel": "/dp",
  "finance": "/financeiro",`;
const viewToUrlReplace = `  "personnel": "/dp",
  "hr": "/rh",
  "payroll": "/folha",
  "esocial": "/esocial",
  "finance": "/financeiro",`;

content = content.replace(viewToUrlSearch, viewToUrlReplace);
fs.writeFileSync('src/router/routes.mjs', content);
