import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [sidebar, app, styles] = await Promise.all([
  readFile(new URL("../src/navigation/sidebar.mjs", import.meta.url), "utf8"),
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/styles.css", import.meta.url), "utf8"),
]);

test("sidebar tem accordion, conta no rodapé e ações acessíveis", () => {
  assert.match(sidebar, /nav-label-btn/);
  assert.match(sidebar, /nav-group-content/);
  assert.match(sidebar, /sidebar-account-actions/);
  assert.match(sidebar, /data-dialog="my-profile"/);
  assert.match(sidebar, /data-logout/);
});

test("sidebar usa navegação de item, sem aparência de hyperlink", () => {
  assert.match(styles, /\.nav-item\s*\{[\s\S]*text-decoration:\s*none\s*!important/);
  assert.match(styles, /\.nav-group:not\(\.expanded\) \.nav-group-content\s*\{\s*display:\s*none/);
  assert.match(styles, /--sidebar-expanded-width:\s*252px/);
  assert.match(styles, /--sidebar-collapsed-width:\s*72px/);
});

test("abrir um grupo recolhe os demais sem mudar a rota", () => {
  assert.match(app, /app\.querySelectorAll\("\.nav-group\.expanded"\)/);
  assert.match(app, /openGroup\.classList\.remove\("expanded"\)/);
  assert.match(app, /groupToggle\.setAttribute\("aria-expanded", isExpanded\)/);
});
