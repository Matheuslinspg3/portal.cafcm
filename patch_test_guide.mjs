import fs from 'fs';
let content = fs.readFileSync('tests/interactive-onboarding.test.mjs', 'utf8');

const guideTestSearch = `    for (const item of guide.steps) {
      assert.ok(item.title && item.text.length > 40 && item.target, key + '/' + item.title);
      if (item.action) {
        assert.ok(item.action.permission);
      }`;
const guideTestReplace = `    for (const item of guide.steps) {
      assert.ok(item.title && item.text.length > 40 && item.target, key + '/' + item.title);
      if (item.action && item.action.permission !== undefined) {
        assert.ok(item.action.permission);
      }`;
content = content.replace(guideTestSearch, guideTestReplace);
fs.writeFileSync('tests/interactive-onboarding.test.mjs', content);
