import assert from 'node:assert/strict';
import { test } from 'node:test';

import { columnRulesFromForm, getStageAge } from './flow.js';

test('idade usa a entrada na etapa e não a última edição; concluídos não ficam parados', () => {
  const now = Date.parse('2026-11-22T12:00:00Z');
  const card = { etapaDesde: '2026-11-12T12:00:00Z', updatedAt: '2026-11-22T11:59:00Z' };

  assert.deepEqual(getStageAge(card, now), {
    hours: 240,
    stale: true,
    label: '10 dias nesta etapa',
  });

  assert.equal(getStageAge({ ...card, dadosExtras: { prazoConcluido: true } }, now).stale, false);
  assert.equal(getStageAge({}, now), null);
  assert.equal(getStageAge(card, now, null).stale, false);
  assert.equal(getStageAge({ createdAt: '2026-11-23T00:00:00Z' }, now).hours, 0);
});

test('formulário distingue prazo imediato de automação sem prazo e mantém flags', () => {
  const form = new FormData();

  form.set('exigirChecklist', 'on');
  form.set('automacaoPrazoDias', '0');
  form.set('automacaoTarefa', ' Nova tarefa ');
  form.set('diasSemMovimento', '3');

  const rules = columnRulesFromForm(form);

  assert.equal(rules.automacao.prazoDias, 0);
  assert.equal(rules.automacao.tarefa, 'Nova tarefa');
  assert.equal(rules.exigirChecklist, true);
  assert.equal(rules.exigirResponsavel, false);
  assert.equal(rules.diasSemMovimento, 3);
  form.set('automacaoPrazoDias', '');
  assert.equal(columnRulesFromForm(form).automacao.prazoDias, null);
});
