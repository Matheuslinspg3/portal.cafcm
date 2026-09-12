import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, styles] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/styles.css", import.meta.url), "utf8"),
]);

test("o guia conduz a pessoa pela tela e destaca a ação correspondente", () => {
  assert.match(source, /function startWizardStep/);
  assert.match(source, /function wizardTarget/);
  assert.match(source, /wizard-tour-mask/);
  assert.match(source, /wizard-highlight/);
  assert.match(source, /scrollIntoView/);
});

test("o financeiro possui passos separados para receber, pagar e consultar calendário", () => {
  assert.match(source, /Controle o que a CAFCM tem a receber/);
  assert.match(source, /Registre o que a CAFCM tem a pagar/);
  assert.match(source, /Veja os vencimentos no calendário/);
  assert.match(source, /financeTab: "calendar"/);
});

test("o destaque permanece utilizável e o tutorial pode ser fechado", () => {
  assert.match(styles, /\.wizard-highlight/);
  assert.match(styles, /z-index: 130/);
  assert.match(source, /dataset\.wizardHighlight/);
  assert.match(source, /clearWizardHighlight\(\)/);
});
