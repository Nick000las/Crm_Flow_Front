import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatDueDate, getCardDetails, getDueState, hasNewerCardVersion } from './card-details.js';

test('prazo considera a data local sem converter o vencimento para UTC', () => {
  const today = new Date(2026, 9, 15, 23, 59);
  assert.equal(getDueState('2026-10-14', false, today).key, 'overdue');
  assert.equal(getDueState('2026-10-15', false, today).key, 'today');
  assert.equal(getDueState('2026-10-16', false, today).key, 'scheduled');
  assert.equal(formatDueDate('2026-10-15'), '15/10/2026');
});

test('entrega concluída não fica atrasada e ausência de prazo não gera indicador', () => {
  assert.equal(getDueState('2020-01-01', true).key, 'done');
  assert.equal(getDueState(null, false), null);
  assert.equal(getDueState('', true), null);
});

test('cards antigos sem metadados continuam editáveis', () => {
  assert.deepEqual(getCardDetails({}), {
    descricao: '',
    prioridade: 'sem_prioridade',
    prazo: '',
    prazoConcluido: false,
    etiquetas: [],
    checklist: [],
  });
});

test('metadados antigos incompatíveis não quebram a renderização', () => {
  const details = getCardDetails({
    dadosExtras: {
      descricao: {},
      prioridade: 'invalida',
      etiquetas: [null, 'antiga'],
      checklist: [null],
    },
  });
  assert.equal(details.descricao, '');
  assert.equal(details.prioridade, 'sem_prioridade');
  assert.deepEqual(details.etiquetas, []);
  assert.deepEqual(details.checklist, []);
});

test('recarga paralela ignora snapshot antigo e sinaliza apenas versões posteriores do mesmo card', () => {
  const card = { id: 'card-1', updatedAt: '2026-10-15T12:00:00.000Z' };
  assert.equal(
    hasNewerCardVersion(card, { ...card, updatedAt: '2026-10-15T11:59:00.000Z' }),
    false,
  );
  assert.equal(hasNewerCardVersion(card, { ...card }), false);
  assert.equal(hasNewerCardVersion(card, { ...card, updatedAt: '2026-10-15T12:01:00.000Z' }), true);
  assert.equal(
    hasNewerCardVersion(card, { ...card, id: 'card-2', updatedAt: '2026-10-15T12:01:00.000Z' }),
    false,
  );
  assert.equal(hasNewerCardVersion(card, undefined), false);
});
