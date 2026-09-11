import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, bundle, migration] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/app.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260910195458_phase_three_administration.sql", import.meta.url), "utf8"),
]);

test("o pacote publicado contém os quatro módulos da Fase 3", () => {
  assert.match(source, /Departamento Pessoal/);
  assert.match(source, /Controle manual de cobranças/);
  assert.match(source, /Arquivo privado por jovem/);
  assert.match(source, /Acesse as rotinas administrativas por esteira/);
  assert.match(bundle, /financial_charges/);
  assert.match(bundle, /document_requirements/);
  assert.match(bundle, /termination_checklist_items/);
  assert.match(bundle, /data-open-procedure-pipeline/);
});

test("o financeiro manual controla o ciclo completo da cobrança", () => {
  assert.match(source, /financial-charge-form/);
  assert.match(source, /invoice_number/);
  assert.match(source, /payment_slip_line/);
  assert.match(source, /paid_amount/);
  assert.match(migration, /create table public\.financial_charges/);
  for (const status of ["to_invoice", "invoice_issued", "payment_slip_issued", "sent", "overdue", "collection", "paid"]) {
    assert.match(migration, new RegExp(`'${status}'`));
  }
});

test("documentos e desligamentos preservam pendências e checklists", () => {
  assert.match(migration, /create table public\.document_requirements/);
  assert.match(migration, /create table public\.termination_checklist_items/);
  assert.match(migration, /seed_termination_checklist/);
  assert.match(source, /data-archive-document/);
  assert.match(source, /document-requirement-form/);
  assert.match(source, /termination-check-/);
});

test("as relações entre contratos, jovens e empresas são validadas no banco", () => {
  assert.match(migration, /validate_phase_three_relationships/);
  assert.match(migration, /leave_records_validate_relationships/);
  assert.match(migration, /financial_charges_validate_relationships/);
});

test("as novas tabelas possuem RLS e acesso por departamento", () => {
  for (const table of ["financial_charges", "document_requirements", "termination_checklist_items"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /has_portal_permission\('finance\.read'\)/);
  assert.match(migration, /has_portal_permission\('documents\.read'\)/);
  assert.match(migration, /has_portal_permission\('personnel\.read'\)/);
  assert.match(migration, /revoke all on table public\.financial_charges, public\.document_requirements, public\.termination_checklist_items from public, anon/);
});

test("a Fase 3 não antecipa integração bancária ou agendamentos da Fase 4", () => {
  assert.doesNotMatch(migration, /pg_cron|cron\.schedule|bradesco|webhook|http_request/i);
});

test("não há referências de desenvolvimento ou da ferramenta no produto", () => {
  for (const file of [source, bundle]) {
    assert.doesNotMatch(file, /chatgpt/i);
    assert.doesNotMatch(file, /openai/i);
    assert.doesNotMatch(file, /localhost:3000/i);
    assert.doesNotMatch(file, /\$%7BSUPABASE_URL%7D/i);
  }
});
