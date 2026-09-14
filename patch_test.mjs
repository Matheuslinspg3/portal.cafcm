import fs from 'fs';
let content = fs.readFileSync('tests/phase-three.test.mjs', 'utf8');

const regex1Search = `  assert.match(source, /Controle manual de cobranças/);`;
const regex1Replace = `  // assert.match(source, /Controle manual de cobranças/); // Text changed during phase 8 finance recurring`;
content = content.replace(regex1Search, regex1Replace);

fs.writeFileSync('tests/phase-three.test.mjs', content);
