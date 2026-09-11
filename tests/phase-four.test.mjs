import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, bundle, migration, edgeFunction] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/app.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260911030417_phase_four_automations.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/portal-automation/index.ts", import.meta.url), "utf8"),
]);

test("a Fase 4 está disponível no pacote publicado", () => {
  assert.match(source, /renderAutomations/);
  assert.match(source, /data-run-automations/);
  assert.match(source, /data-notification-filter/);
  assert.match(bundle, /portal-automation/);
  assert.match(bundle, /Bradesco/);
});

test("o orquestrador gera alertas e tarefas sem decisões críticas automáticas", () => {
  assert.match(migration, /run_phase_four_automations/);
  assert.match(migration, /sync_phase_four_work/);
  assert.match(migration, /on conflict\(automation_key\)/);
  assert.match(migration, /'15 \* \* \* \*'/);
  assert.doesNotMatch(migration, /update public\.financial_charges[^;]+status='paid'/s);
  assert.doesNotMatch(migration, /update public\.termination_cases[^;]+status='completed'/s);
});

test("alertas cobrem as rotinas operacionais da CAFCM", () => {
  for (const key of ["document-requirement:", "document-expiry:", "financial-charge:", "recruitment-stalled:", "termination-date:", "leave-date:", "academic-overdue:"]) {
    assert.match(migration, new RegExp(key));
  }
});

test("documentos são gerados como rascunho com protocolo e revisão", () => {
  assert.match(edgeFunction, /PDFDocument/);
  assert.match(edgeFunction, /Protocolo/);
  assert.match(edgeFunction, /status: "draft"/);
  assert.match(source, /data-review-generation/);
  assert.match(migration, /create table public\.document_generations/);
});

test("e-mails exigem conferência e usam segredo somente no servidor", () => {
  assert.match(source, /Você conferiu o destinatário/);
  assert.match(edgeFunction, /Deno\.env\.get\("RESEND_API_KEY"\)/);
  assert.match(edgeFunction, /Deno\.env\.get\("PORTAL_EMAIL_FROM"\)/);
  assert.match(edgeFunction, /https:\/\/api\.resend\.com\/emails/);
  assert.doesNotMatch(source, /RESEND_API_KEY\s*=/);
  assert.doesNotMatch(bundle, /re_[A-Za-z0-9_-]{20,}/);
});

test("a preparação bancária não simula emissão ou conexão com o banco", () => {
  assert.match(migration, /create table public\.banking_integrations/);
  assert.match(migration, /create table public\.bank_file_batches/);
  assert.match(source, /Sem conexão automática/);
  assert.doesNotMatch(edgeFunction, /bradesco\.com|cnab.*generate|emitir.*boleto/i);
});

test("as novas tabelas possuem RLS e não são públicas", () => {
  for (const table of ["automation_runs", "document_templates", "document_generations", "banking_integrations", "bank_file_batches"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
  }
  assert.match(migration, /revoke all on table public\.automation_runs[^;]+from public, anon/s);
});

test("não há referências da ferramenta ou endereço local no produto", () => {
  for (const file of [source, bundle]) {
    assert.doesNotMatch(file, /chatgpt|openai/i);
    assert.doesNotMatch(file, /localhost:3000/i);
    assert.doesNotMatch(file, /\$%7BSUPABASE_URL%7D/i);
  }
});
