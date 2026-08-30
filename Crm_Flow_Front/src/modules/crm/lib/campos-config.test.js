import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  MENSAGENS_CAMPOS,
  payloadDaDefinicao,
  proximaOrdem,
  validarDefinicao,
  valoresDaDefinicao,
} from './campos-config.js';

describe('ordem de campo novo', () => {
  test('proximaOrdem vai depois de tudo', () => {
    assert.equal(proximaOrdem([{ ordem: 3 }, { ordem: 12 }]), 13);
    assert.equal(proximaOrdem([]), 1);
  });
});

describe('form de definição', () => {
  test('valores padrão de criação', () => {
    assert.deepEqual(valoresDaDefinicao(), {
      label: '',
      tipo: 'texto',
      obrigatorio: false,
      opcoes: [''],
    });
  });

  test('seleção exige opções não vazias e sem repetição', () => {
    const base = { label: 'Plano', tipo: 'selecao', obrigatorio: false };

    assert.equal(validarDefinicao({ ...base, opcoes: ['  ', ''] }).opcoes, MENSAGENS_CAMPOS.OPCOES);
    assert.equal(
      validarDefinicao({ ...base, opcoes: ['A', ' A '] }).opcoes,
      MENSAGENS_CAMPOS.OPCAO_REPETIDA,
    );
    assert.deepEqual(validarDefinicao({ ...base, opcoes: ['A', 'B'] }), {});
  });

  test('rótulo obrigatório', () => {
    assert.equal(
      validarDefinicao({ ...valoresDaDefinicao(), label: ' ' }).label,
      MENSAGENS_CAMPOS.LABEL,
    );
  });

  test('payload limpa opções e só as envia para seleção', () => {
    assert.deepEqual(
      payloadDaDefinicao({
        label: ' Plano ',
        tipo: 'selecao_multipla',
        obrigatorio: true,
        opcoes: [' A', '', 'B '],
      }),
      { label: 'Plano', tipo: 'selecao_multipla', obrigatorio: true, opcoes: ['A', 'B'] },
    );
    assert.deepEqual(
      payloadDaDefinicao({ label: 'Renda', tipo: 'numero', obrigatorio: false, opcoes: ['x'] }),
      {
        label: 'Renda',
        tipo: 'numero',
        obrigatorio: false,
      },
    );
  });
});
