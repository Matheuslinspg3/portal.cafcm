import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, bundle, migration] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/app.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260912110000_phase_six_accounts_payable_onboarding.sql", import.meta.url), "utf8"),
]);

test("contas a pagar ficam separadas das cobranças a receber", () => {
  assert.match(source, /accounts_payable/);
  assert.match(source, /Contas a pagar/);
  assert.match(source, /Agenda financeira/);
  assert.match(migration, /create table public\.accounts_payable/);
  assert.match(migration, /supplier_name/);
  assert.match(migration, /due_date date not null/);
});

test("contas a pagar têm calendário, lembretes e confirmação manual", () => {
  assert.match(source, /financeCalendar/);
  assert.match(source, /reminderDays/);
  assert.match(source, /Nenhum pagamento é enviado ao banco nesta etapa/);
  assert.match(migration, /reminder_days integer\[\]/);
  assert.match(migration, /refresh_phase_six_finance_alerts/);
  assert.match(migration, /Conta a pagar próxima do vencimento/);
});

test("financeiro e direção mantêm o acesso protegido", () => {
  assert.match(migration, /alter table public\.accounts_payable enable row level security/);
  assert.match(migration, /revoke all on table public\.accounts_payable from public, anon/);
  assert.match(migration, /has_portal_permission\('finance\.read'\)/);
  assert.match(migration, /has_portal_permission\('finance\.manage'\)/);
  assert.match(migration, /capture_administrative_audit/);
});

test("o guia leva cada departamento a um primeiro cadastro real", () => {
  assert.match(source, /wizardActions/);
  assert.match(source, /data-wizard-create/);
  assert.match(source, /Criar conta a pagar/);
  assert.match(source, /Criar primeira cobrança/);
  assert.match(bundle, /data-wizard-create/);
});

test("a fase não cria dados fictícios, chaves bancárias ou conteúdo de desenvolvimento", () => {
  assert.doesNotMatch(migration, /insert into public\.accounts_payable/i);
  for (const file of [source, bundle]) {
    assert.doesNotMatch(file, /chatgpt|openai|localhost:3000/i);
  }
});
