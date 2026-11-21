import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PAPEIS_GESTAO } from '../constants.js';
import { DEFINICOES_ABAS_FORECAST } from './forecast-abas.js';
import { AJUDA_FAIXA, rotuloMesSemAno } from './assertividade-textos.js';

test('a ajuda de faixa mostra os limites 80% e 120%', () => {
  assert.match(AJUDA_FAIXA.otimista, /80%/);
  assert.match(AJUDA_FAIXA.boa, /80%/);
  assert.match(AJUDA_FAIXA.boa, /120%/);
  assert.match(AJUDA_FAIXA.pessimista, /120%/);
});

test('rotuloMesSemAno devolve o nome do mês e mantém entrada inválida', () => {
  assert.equal(rotuloMesSemAno('2026-10'), 'outubro');
  assert.equal(rotuloMesSemAno('2026-13'), '2026-13');
  assert.equal(rotuloMesSemAno('outubro'), 'outubro');
  assert.equal(rotuloMesSemAno(undefined), undefined);
});

test('a aba Assertividade é só da gestão e atrás da flag crm.forecast', () => {
  assert.deepEqual(DEFINICOES_ABAS_FORECAST[1].roles, PAPEIS_GESTAO);
  assert.equal(DEFINICOES_ABAS_FORECAST[1].feature, 'crm.forecast');
});
