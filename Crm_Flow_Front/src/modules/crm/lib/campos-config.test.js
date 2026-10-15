import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  MENSAGENS_CAMPOS,
  alterarVisibilidade,
  lerOrdem,
  linhasAlteradas,
  payloadDaDefinicao,
  proximaOrdem,
  reordenar,
  validarDefinicao,
  valoresDaDefinicao,
} from './campos-config.js';

describe('visibilidade (Camada 2)', () => {
  const linha = { coluna: 'empresa', visivel: true, ordem: 10, obrigatorio: true };

  test('ocultar tira a obrigatoriedade', () => {
    assert.deepEqual(alterarVisibilidade(linha, { visivel: false }), {
      ...linha,
      visivel: false,
      obrigatorio: false,
    });
  });

  test('alterar outra coisa mantém o resto', () => {
    assert.equal(alterarVisibilidade(linha, { ordem: 3 }).obrigatorio, true);
  });

  test('só as linhas alteradas vão no PUT', () => {
    const iniciais = [linha, { coluna: 'cargo', visivel: false, ordem: 0, obrigatorio: false }];
    const atuais = [linha, { ...iniciais[1], visivel: true }];

    assert.deepEqual(linhasAlteradas(iniciais, atuais), [atuais[1]]);
    assert.deepEqual(linhasAlteradas(iniciais, iniciais), []);
  });

  test('lerOrdem aceita só inteiro', () => {
    assert.equal(lerOrdem(' 12 '), 12);
    assert.equal(lerOrdem('-1'), -1);
    assert.equal(lerOrdem('1.5'), null);
    assert.equal(lerOrdem(''), null);
  });
});

describe('reordenar (Camada 3)', () => {
  const definicoes = [
    { id: 'a', ordem: 10 },
    { id: 'b', ordem: 11 },
    { id: 'c', ordem: 20 },
  ];

  test('subir troca a ordem com o vizinho', () => {
    assert.deepEqual(reordenar(definicoes, 'b', -1), [
      { id: 'b', ordem: 10 },
      { id: 'a', ordem: 11 },
    ]);
  });

  test('descer o último ou subir o primeiro não faz nada', () => {
    assert.deepEqual(reordenar(definicoes, 'c', 1), []);
    assert.deepEqual(reordenar(definicoes, 'a', -1), []);
  });

  test('empate de ordem vira crescente para a troca valer', () => {
    const empatadas = [
      { id: 'a', ordem: 5 },
      { id: 'b', ordem: 5 },
    ];

    assert.deepEqual(reordenar(empatadas, 'b', -1), [{ id: 'a', ordem: 6 }]);
  });

  test('proximaOrdem vai depois de tudo', () => {
    assert.equal(proximaOrdem([{ ordem: 3 }, { ordem: 12 }]), 13);
    assert.equal(proximaOrdem([]), 1);
  });
});

describe('form de definição', () => {
  test('valores padrão de criação', () => {
    assert.deepEqual(valoresDaDefinicao(), { label: '', tipo: 'texto', obrigatorio: false, opcoes: [''] });
  });

  test('seleção exige opções não vazias e sem repetição', () => {
    const base = { label: 'Plano', tipo: 'selecao', obrigatorio: false };

    assert.equal(validarDefinicao({ ...base, opcoes: ['  ', ''] }).opcoes, MENSAGENS_CAMPOS.OPCOES);
    assert.equal(validarDefinicao({ ...base, opcoes: ['A', ' A '] }).opcoes, MENSAGENS_CAMPOS.OPCAO_REPETIDA);
    assert.deepEqual(validarDefinicao({ ...base, opcoes: ['A', 'B'] }), {});
  });

  test('rótulo obrigatório', () => {
    assert.equal(validarDefinicao({ ...valoresDaDefinicao(), label: ' ' }).label, MENSAGENS_CAMPOS.LABEL);
  });

  test('payload limpa opções e só as envia para seleção', () => {
    assert.deepEqual(
      payloadDaDefinicao({ label: ' Plano ', tipo: 'selecao_multipla', obrigatorio: true, opcoes: [' A', '', 'B '] }),
      { label: 'Plano', tipo: 'selecao_multipla', obrigatorio: true, opcoes: ['A', 'B'] },
    );
    assert.deepEqual(payloadDaDefinicao({ label: 'Renda', tipo: 'numero', obrigatorio: false, opcoes: ['x'] }), {
      label: 'Renda',
      tipo: 'numero',
      obrigatorio: false,
    });
  });
});
