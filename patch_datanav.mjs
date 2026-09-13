import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

const legacyDataNavSearch = `  const target = event.target.closest("button, [data-nav]");
  if (!target) return;

  if (target.dataset.authMode) return renderLogin(target.dataset.authMode);`;

const legacyDataNavReplace = `  const target = event.target.closest("button, [data-nav]");
  if (!target) return;

  if (target.hasAttribute("data-nav") && !target.closest(".sidebar")) {
    event.preventDefault();
    pushView(target.getAttribute("data-nav"));
    return;
  }

  if (target.dataset.authMode) return renderLogin(target.dataset.authMode);`;

content = content.replace(legacyDataNavSearch, legacyDataNavReplace);
fs.writeFileSync('src/app.js', content);
