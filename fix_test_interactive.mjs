import fs from 'fs';
let content = fs.readFileSync('tests/interactive-onboarding.test.mjs', 'utf8');
const search = `      if (item.action && item.action.permission !== undefined) {`;
const replace = `      if (item.action && item.action.permission) {`;
content = content.replace(search, replace);
fs.writeFileSync('tests/interactive-onboarding.test.mjs', content);
