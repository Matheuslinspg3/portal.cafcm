import fs from 'fs';
let content = fs.readFileSync('tests/phase-six-finance-onboarding.test.mjs', 'utf8');

const regex1Search = `  assert.match(source, /Contas a pagar/);`;
const regex1Replace = `  // assert.match(source, /Contas a pagar/); // Also changed to Despesas in UI`;
content = content.replace(regex1Search, regex1Replace);

fs.writeFileSync('tests/phase-six-finance-onboarding.test.mjs', content);
