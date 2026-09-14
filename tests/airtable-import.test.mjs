import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, migration] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260913201213_airtable_import_registry.sql", import.meta.url), "utf8"),
]);

test("cadastros importados aparecem sem criar autenticação", () => {
  assert.match(source, /from\("apprentice_registry"\)/);
  assert.match(source, /recordOnly: true/);
  assert.match(source, /E-mail a conferir/);
  assert.doesNotMatch(source, /inviteUserByEmail.*apprentise_registry|apprentice_registry.*inviteUserByEmail/s);
});

test("contratos importados continuam vinculados a empresas e jovens", () => {
  assert.match(source, /from\("apprentice_contract_registry"\)/);
  assert.match(source, /Cadastro sem acesso/);
  assert.match(migration, /references public\.apprentice_registry\(id\) on delete cascade/);
  assert.match(migration, /references public\.companies\(id\) on delete restrict/);
});

test("dados importados têm RLS e escopo por departamento ou empresa", () => {
  assert.match(migration, /alter table public\.apprentice_registry enable row level security/);
  assert.match(migration, /alter table public\.apprentice_contract_registry enable row level security/);
  assert.match(migration, /current_company_id\(\)/);
  assert.match(migration, /contracts\.read/);
  assert.match(migration, /revoke all on table public\.apprentice_registry, public\.apprentice_contract_registry from anon/);
});

test("a migração não contém dados reais do Airtable", () => {
  assert.doesNotMatch(migration, /CEDIAL|ANA BEATRIZ|05625623000173|54053600820/i);
});
