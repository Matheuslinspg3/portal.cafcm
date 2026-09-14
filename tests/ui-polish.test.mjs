import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const [sidebar, app, styles] = await Promise.all([
  readFile(new URL("../src/navigation/sidebar.mjs", import.meta.url), "utf8"),
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/styles.css", import.meta.url), "utf8"),
]);
const navigation = vm.runInNewContext(`(${app.match(/const navigation = ([\s\S]*?);\n/)[1]})`);

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

test("sidebar segue a hierarquia funcional atual", () => {
  const admin = navigation.cafcm_admin;
  assert.deepEqual(Array.from(admin, (group) => group.label), [
    "Painel", "Operações", "Empresas", "Jovens", "Recursos Humanos",
    "Departamento Pessoal", "Financeiro", "Documentos", "Pedagógico", "Gestão",
  ]);
  assert.doesNotMatch(app, /label: "Gestão de vagas"/);
  assert.doesNotMatch(app, /label: "Administrativo"/);
  for (const label of ["Recursos Humanos", "Departamento Pessoal", "Financeiro", "Pedagógico", "Gestão"]) {
    assert.match(app, new RegExp(`label: "${label}"`));
  }
  assert.match(app, /\["overview", "Visão Geral", "grid", \{ route: "\/visao-geral" \}\]/);
  assert.match(app, /\["overview", "Visão Geral", "grid", \{ route: "\/rh" \}\]/);
  assert.match(app, /label: "Recursos Humanos"/);
  assert.match(app, /\["vacancies", "Candidatos", "users", \{ route: "\/vagas\/candidatos" \}\]/);
  assert.match(app, /label: "Departamento Pessoal"/);
  assert.match(app, /\["personnel", "Folha e Ponto", "clock", \{ route: "\/folha" \}\]/);
  assert.match(app, /\["accounting", "eSocial \/ Obriga[cç][oõ]es", "mail", \{ route: "\/esocial" \}\]/);
  assert.match(app, /label: "Financeiro"/);
  assert.match(app, /\["finance", "Faturamento", "calendar", \{ route: "\/faturamento", children:/);
  assert.match(app, /\["finance", "Geração em lote", "copy"/);
  assert.match(app, /label: "Pedagógico"/);
  assert.match(app, /\["automations", "Automações", "clock"\]/);
  assert.deepEqual(Array.from(admin.find((group) => group.label === "Recursos Humanos").items, ([,, , meta]) => meta?.route), ["/rh", "/vagas", "/vagas/candidatos", "/vagas/processos-seletivos"]);
  assert.deepEqual(Array.from(admin.find((group) => group.label === "Departamento Pessoal").items, ([, label]) => label), ["Visão Geral", "Admissões", "Contratos", "Folha e Ponto", "Férias e Afastamentos", "Rescisões", "eSocial / Obrigações"]);
  assert.deepEqual(Array.from(admin.find((group) => group.label === "Financeiro").items, ([, label]) => label), ["Visão Geral", "Faturamento", "Despesas", "Boletos e Recebimentos"]);
});

test("guardrails evitam overflow horizontal no financeiro e no frame", () => {
  assert.match(styles, /html,\s*body \{ max-width: 100%; overflow-x: hidden; \}/);
  assert.match(styles, /\.portal-main,\s*\.topbar,\s*\.content,[\s\S]*max-width: 100%/);
  assert.match(styles, /\.finance-row \{ grid-template-columns: auto minmax\(0, 1fr\)/);
  assert.match(styles, /\.operations-tabs \{ max-width: 100%; overflow-x: auto/);
});
