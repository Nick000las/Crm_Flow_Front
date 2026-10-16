import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agruparFeaturesPorModulo, mesmoConjunto } from './features.js';

test('agrupa as flags por módulo, mantendo a ordem do catálogo', () => {
  const catalogo = [
    { moduleKey: 'crm', featureKey: 'crm.layout' },
    { moduleKey: 'kanban', featureKey: 'kanban.swimlanes' },
    { moduleKey: 'crm', featureKey: 'crm.listas' },
  ];

  assert.deepEqual(agruparFeaturesPorModulo(catalogo), [
    { moduleKey: 'crm', features: ['crm.layout', 'crm.listas'] },
    { moduleKey: 'kanban', features: ['kanban.swimlanes'] },
  ]);
});

test('catálogo vazio não gera grupo', () => {
  assert.deepEqual(agruparFeaturesPorModulo([]), []);
});

test('mesmoConjunto ignora a ordem', () => {
  assert.equal(mesmoConjunto(['a', 'b'], ['b', 'a']), true);
  assert.equal(mesmoConjunto(['a'], ['a', 'b']), false);
  assert.equal(mesmoConjunto([], []), true);
});
