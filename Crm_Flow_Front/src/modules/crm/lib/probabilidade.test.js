import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MENSAGENS } from './form-lead.js';
import {
  CODIGO_PROBABILIDADE_REDEFINIDA,
  avisoDeProbabilidade,
  juntarAvisos,
  lerProbabilidade,
  placeholderDoPadrao,
  probabilidadeFixa,
  textoDaProbabilidade,
  validarProbabilidade,
} from './probabilidade.js';

const AVISO = {
  codigo: CODIGO_PROBABILIDADE_REDEFINIDA,
  campo: 'probabilidadeFechamento',
  anterior: 60,
};

test('ganho e perdido têm probabilidade fixa; aberto é editável', () => {
  assert.equal(probabilidadeFixa('ganho'), 100);
  assert.equal(probabilidadeFixa('perdido'), 0);
  assert.equal(probabilidadeFixa('aberto'), null);
  assert.equal(probabilidadeFixa(null), null);
});

test('avisoDeProbabilidade monta a frase com o padrão e o anterior', () => {
  assert.equal(
    avisoDeProbabilidade([AVISO], 80),
    'A probabilidade voltou ao padrão do status (80%). Antes era 60%.',
  );
  assert.equal(
    avisoDeProbabilidade([AVISO], 0),
    'A probabilidade voltou ao padrão do status (0%). Antes era 60%.',
  );
});

test('sem a efetiva, a frase sai sem o número do padrão', () => {
  assert.equal(
    avisoDeProbabilidade([AVISO]),
    'A probabilidade voltou ao padrão do status. Antes era 60%.',
  );
});

test('sem o aviso (lista vazia, ausente ou outro código), não há texto', () => {
  assert.equal(avisoDeProbabilidade([], 80), null);
  assert.equal(avisoDeProbabilidade(undefined, 80), null);
  assert.equal(avisoDeProbabilidade([{ ...AVISO, codigo: 'OUTRO' }], 80), null);
});

test('juntarAvisos junta só o que existe', () => {
  assert.equal(juntarAvisos('Status alterado.', 'Outro.'), 'Status alterado. Outro.');
  assert.equal(juntarAvisos(null, 'Outro.'), 'Outro.');
  assert.equal(juntarAvisos(null, undefined), null);
});

test('textoDaProbabilidade marca quando vale a do status', () => {
  assert.deepEqual(
    textoDaProbabilidade({ probabilidadeFechamento: null, probabilidadeEfetiva: 60 }),
    { valor: '60%', doStatus: true },
  );
  assert.deepEqual(
    textoDaProbabilidade({ probabilidadeFechamento: 35, probabilidadeEfetiva: 35 }),
    { valor: '35%', doStatus: false },
  );
});

test('sem a efetiva (campo oculto para o papel), nada aparece', () => {
  assert.equal(textoDaProbabilidade({}), null);
});

test('placeholderDoPadrao mostra o número quando é conhecido', () => {
  assert.equal(placeholderDoPadrao(40), 'Padrão do status (40%)');
  assert.equal(placeholderDoPadrao(undefined), 'Padrão do status');
});

test('validarProbabilidade aceita inteiro de 0 a 100 e vazio', () => {
  assert.equal(validarProbabilidade(''), null);
  assert.equal(validarProbabilidade('0'), null);
  assert.equal(validarProbabilidade('100'), null);
  assert.equal(validarProbabilidade('101'), MENSAGENS.PROBABILIDADE_INVALIDA);
  assert.equal(validarProbabilidade('12,5'), MENSAGENS.PROBABILIDADE_INVALIDA);
  assert.equal(validarProbabilidade('abc'), MENSAGENS.PROBABILIDADE_INVALIDA);
});

test('lerProbabilidade: vazio é null, texto vira número', () => {
  assert.equal(lerProbabilidade(''), null);
  assert.equal(lerProbabilidade('35'), 35);
});
