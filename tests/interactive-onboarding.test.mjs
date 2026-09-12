import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import { getPageGuide, guideKeyFor, pageGuides } from '../src/guides/catalog.mjs';
import { tourPlacement } from '../src/guides/tour.mjs';
import { describeField } from '../src/guides/forms.mjs';

const source = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
const engine = await readFile(new URL('../src/guides/tour.mjs', import.meta.url), 'utf8');
const navigation = vm.runInNewContext('(' + source.match(/const navigation = ([\s\S]*?);\n/)[1] + ')');
const permissionSets = vm.runInNewContext('(' + source.match(/const departmentPermissions = ([\s\S]*?);\n/)[1] + ')');
const viewPermissions = vm.runInNewContext('(' + source.match(/const viewPermissions = ([\s\S]*?);\n/)[1] + ')');

test('todas as abas de todos os perfis têm um guia com vários assuntos', () => {
  for (const groups of Object.values(navigation)) for (const group of groups) for (const [view] of group.items) {
    const guide = getPageGuide({ view }, () => true);
    assert.ok(guide, 'Falta guia para ' + view);
    assert.ok(guide.steps.length >= 4, view + ': roteiro insuficiente');
  }
});

for (const [view, field, subtabs] of [
  ['finance', 'financeTab', ['receivable', 'payable', 'calendar']],
  ['vacancies', 'vacancyTab', ['overview', 'vacancies', 'candidates', 'applications']],
  ['automations', 'automationTab', ['overview', 'emails', 'documents', 'banking', 'history']],
  ['documents', 'documentTab', ['files', 'requirements', 'archived']],
]) test(view + ': guia independente para cada subaba, sem mudar tela ou filtros', () => {
  const keys = new Set();
  for (const subtab of subtabs) {
    const state = Object.freeze({ view, [field]: subtab, financeSearch: 'manter busca' });
    const guide = getPageGuide(state, () => true);
    assert.equal(guide.key, view + ':' + subtab);
    assert.ok(guide.steps.length >= 4);
    keys.add(guide.key);
    assert.equal(state[field], subtab);
    assert.equal(state.financeSearch, 'manter busca');
  }
  assert.equal(keys.size, subtabs.length);
});

test('editores e aula em andamento têm roteiros próprios', () => {
  for (const view of ['course-editor', 'lesson-editor', 'student-course']) assert.ok(getPageGuide({ view }));
  assert.equal(guideKeyFor({ view: 'student-course', selectedLessonId: 'lesson' }), 'student-lesson');
});

test('todos os roteiros possuem títulos, textos e alvos definidos', () => {
  for (const [key, guide] of Object.entries(pageGuides)) {
    assert.ok(guide.title);
    for (const item of guide.steps) {
      assert.ok(item.title && item.text.length > 40 && item.target, key + '/' + item.title);
      if (item.action) {
        assert.ok(item.permission, 'Abertura de formulário exige permissão');
        assert.equal(item.action.label, 'Abrir formulário');
        assert.deepEqual(Object.keys(item.action).sort(), ['dialog', 'label']);
      }
    }
  }
});

test('as ações do guia respeitam as permissões reais de cada departamento', () => {
  for (const [department, permissions] of Object.entries(permissionSets)) {
    const allowed = name => permissions.includes('*') || permissions.includes(name);
    for (const view of Object.keys(viewPermissions).filter(view => allowed(viewPermissions[view]))) {
      for (const item of getPageGuide({ view }, allowed).steps) {
        assert.ok(!item.permission || allowed(item.permission), department + '/' + view);
      }
    }
    const targets = getPageGuide({ view: 'indicators' }, allowed).steps.some(item => item.permission === 'targets.manage');
    assert.equal(targets, department === 'management');
  }
});

test('consulta sem permissão não oferece formulários de alteração', () => {
  const guide = getPageGuide({ view: 'finance', financeTab: 'payable' });
  assert.equal(guide.steps.some(item => item.action), false);
  assert.equal(getPageGuide({ view: 'unknown' }), null);
});

test('Próximo não executa navegação, banco, submissão nem cliques na página', () => {
  assert.doesNotMatch(engine, /supabase|fetch\(|navigate\(|\.submit\(|\.requestSubmit\(|\.click\(/);
  assert.match(engine, /root\.showModal\(\)/);
  assert.match(engine, /addEventListener\('cancel'/);
  assert.match(engine, /events\?\.abort\(\)/);
  assert.match(engine, /Ir direto ao assunto/);
  assert.match(source, /getPageGuide\(state, hasPermission\)/);
  assert.match(source, /buildFormGuide/);
  assert.doesNotMatch(source, /wizardActions|startWizardStep|wizardHighlight/);
});

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1440, height: 900 }]) {
  test('o balão não sai da tela em ' + viewport.width + 'x' + viewport.height, () => {
    for (const left of [0, 90, viewport.width - 40]) for (const top of [0, 180, viewport.height - 40]) {
      const target = { left, top, right: left + 40, bottom: top + 40, width: 40, height: 40 };
      const place = tourPlacement(target, { width: 390, height: 440 }, viewport);
      assert.ok(place.left >= 0 && place.top >= 0);
      assert.ok(place.left + place.width <= viewport.width);
      assert.ok(place.top + place.height <= viewport.height);
    }
    const centered = tourPlacement(null, { width: 390, height: 1200 }, viewport);
    assert.ok(centered.top >= 0 && centered.height <= viewport.height);
  });
}

test('a ajuda de campo explica restrições sem ler os dados preenchidos', () => {
  const field = { name: 'reminderDays', tagName: 'INPUT', type: 'text', labels: [], required: true, maxLength: 120, minLength: -1, closest: () => null, getAttribute: () => null };
  Object.defineProperty(field, 'value', { get: () => { throw Error('A ajuda não pode ler valores'); } });
  assert.match(describeField(field), /0 a 60 dias/);
  assert.match(describeField(field), /Campo obrigatório/);
  field.name = 'password';
  assert.match(describeField(field), /não lê nem mostra/);
  field.disabled = true;
  assert.match(describeField(field), /somente para consulta/);
});

test('financeiro distingue lembretes e confirmação bancária', () => {
  const payable = getPageGuide({ view: 'finance', financeTab: 'payable' }, () => true);
  assert.match(payable.steps.map(item => item.text).join(' '), /não agenda pagamento no banco/);
  assert.match(payable.steps.map(item => item.text).join(' '), /Nenhum pagamento é enviado ao banco/);
});
