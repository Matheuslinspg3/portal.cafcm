import fs from 'fs';
let content = fs.readFileSync('src/app.js', 'utf8');

// The replacement in patch_app.mjs did not clean up this duplicate properly
content = content.replace('import { viewToUrl } from "./router/router.mjs";', '');
content = content.replace('import { viewToUrl } from "./router/routes.mjs";\nimport { viewToUrl } from "./router/routes.mjs";', 'import { viewToUrl } from "./router/routes.mjs";');

fs.writeFileSync('src/app.js', content);
