import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, bundle, edgeFunction, migration] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/app.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/functions/portal-admin/index.ts", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260910171000_phase_two_operations.sql", import.meta.url), "utf8"),
]);

test("o pacote publicado foi recompilado com a Fase 2", () => {
  assert.match(source, /Da abertura da vaga à admissão do jovem/);
  assert.match(bundle, /data-vacancy-tab/);
  assert.match(bundle, /convert_candidate/);
});

test("a conversão de candidato exige permissão e está exposta pela função administrativa", () => {
  assert.match(edgeFunction, /requireCafcmAdmin\(req, "vacancies\.manage"\)/);
  assert.match(edgeFunction, /action === "convert_candidate"/);
  assert.match(edgeFunction, /application_id: application\.id/);
});

test("o recrutamento possui histórico protegido e armazenamento privado", () => {
  assert.match(migration, /alter table public\.recruitment_events enable row level security/);
  assert.match(migration, /revoke all on table public\.candidate_documents, public\.recruitment_events from anon/);
  assert.match(migration, /'cafcm-recruitment', 'cafcm-recruitment', false/);
  assert.doesNotMatch(migration, /grant select, insert on table public\.recruitment_events/);
});

test("as etapas operacionais estão conectadas às esteiras", () => {
  assert.match(migration, /vacancy_applications_sync_pipeline/);
  assert.match(migration, /admission_cases_sync_pipeline/);
  assert.match(migration, /contracts_sync_pipeline/);
  assert.match(migration, /termination_cases_sync_pipeline/);
  for (const checkpoint of ["expires-90", "expires-60", "expires-30", "expires-15", "expires-7"]) {
    assert.match(migration, new RegExp(checkpoint));
  }
});

test("não há referências de desenvolvimento ou da ferramenta no produto", () => {
  for (const file of [source, bundle]) {
    assert.doesNotMatch(file, /chatgpt/i);
    assert.doesNotMatch(file, /openai/i);
    assert.doesNotMatch(file, /localhost:3000/i);
    assert.doesNotMatch(file, /\$%7BSUPABASE_URL%7D/i);
  }
});
