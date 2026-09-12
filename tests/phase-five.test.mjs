import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [source, bundle, migration] = await Promise.all([
  readFile(new URL("../src/app.js", import.meta.url), "utf8"),
  readFile(new URL("../dist/app.js", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20260911152640_phase_five_indicators.sql", import.meta.url), "utf8"),
]);

test("a Fase 5 está disponível no pacote publicado", () => {
  assert.match(source, /renderIndicators/);
  assert.match(bundle, /get_portal_indicators/);
});

test("os relatórios usam dados reais e respeitam o período", () => {
  assert.match(source, /period_start_value/);
  assert.match(source, /period_end_value/);
  assert.match(migration, /O período deve conter entre 1 e 367 dias/);
  assert.doesNotMatch(migration, /insert into public\.(work_activity_logs|indicator_targets)/i);
});

test("as novas tabelas são protegidas por RLS", () => {
  assert.match(migration, /alter table public\.work_activity_logs enable row level security/);
  assert.match(migration, /alter table public\.indicator_targets enable row level security/);
  assert.match(migration, /revoke all on public\.work_activity_logs, public\.indicator_targets from public, anon/);
});

test("metas são reservadas à Direção e Administração", () => {
  assert.match(migration, /permission_name='targets\.manage' then false/);
  assert.match(source, /profileDepartment\(\) === "management"/);
  assert.match(source, /Somente a Direção e Administração pode definir metas/);
});

test("a exportação é CSV e fica registrada", () => {
  assert.match(source, /data-export-indicators/);
  assert.match(source, /reports\.exported/);
  assert.match(source, /text\/csv;charset=utf-8/);
});

test("o tempo pode ser vinculado a tarefas e processos", () => {
  assert.match(source, /task_id: taskId/);
  assert.match(source, /pipeline_item_id: pipelineItemId/);
  assert.match(migration, /references public\.tasks/);
  assert.match(migration, /references public\.pipeline_items/);
});

test("a Fase 5 não cria ranking ou vigilância de pessoas", () => {
  assert.match(source, /Não há pontuação, ranking ou vigilância individual/);
  assert.doesNotMatch(migration, /leaderboard|employee_score|ranking/i);
  assert.doesNotMatch(bundle, /chatgpt|openai|localhost:3000/i);
});
