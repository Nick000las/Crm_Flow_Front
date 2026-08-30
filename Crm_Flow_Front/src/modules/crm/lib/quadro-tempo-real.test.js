import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cardsDasPaginas } from './quadro.js';
import {
  aplicarNaColuna,
  colunasAfetadas,
  LIMITE_DE_IDS,
  lotesDeIds,
  ordenaPorAtualizacao,
} from './quadro-tempo-real.js';

const card = (entidadeId, hora, extras = {}) => ({
  entidadeId,
  atualizadoEm: `2026-11-07T${hora}:00:00.000Z`,
  ...extras,
});
const paginas = (...listas) => ({
  pages: listas.map(({ itens, proximoCursor = null }) => ({ itens, proximoCursor })),
  pageParams: listas.map(() => undefined),
});
const ids = (dados) => dados.pages.map((pagina) => pagina.itens.map((item) => item.entidadeId));

const ORDEM_POR_NOME = { campo: 'nome', direcao: 'asc' };
const MAIS_ANTIGOS_PRIMEIRO = { campo: 'atualizadoEm', direcao: 'asc' };

test('lotesDeIds respeita o limite da rota', () => {
  const todos = Array.from({ length: LIMITE_DE_IDS + 1 }, (_, indice) => String(indice));

  assert.deepEqual(
    lotesDeIds(todos).map((lote) => lote.length),
    [LIMITE_DE_IDS, 1],
  );

  assert.deepEqual(lotesDeIds([]), []);
});

test('ordenaPorAtualizacao vale para a ordem padrão e para a sua inversa', () => {
  assert.equal(ordenaPorAtualizacao(undefined), true);
  assert.equal(ordenaPorAtualizacao(MAIS_ANTIGOS_PRIMEIRO), true);
  assert.equal(ordenaPorAtualizacao(ORDEM_POR_NOME), false);
});

test('colunasAfetadas junta a coluna de origem e a de destino', () => {
  const dados = new Map([
    ['novo', paginas({ itens: [card('a', '10')] })],
    ['proposta', paginas({ itens: [] })],
  ]);
  const releitura = { itens: [card('a', '11', { colunaRef: 'proposta' })], ausentes: [] };

  assert.deepEqual(colunasAfetadas(dados, releitura), {
    colunas: new Set(['proposta', 'novo']),
    desconhecido: false,
  });
});

test('colunasAfetadas avisa quando não sabe de onde o card veio', () => {
  const dados = new Map([['novo', paginas({ itens: [card('a', '10')] })]]);

  assert.equal(colunasAfetadas(dados, { itens: [], ausentes: ['b'] }).desconhecido, true);
  assert.equal(colunasAfetadas(dados, { itens: [], ausentes: ['a'] }).desconhecido, false);

  assert.deepEqual(
    colunasAfetadas(dados, { itens: [], ausentes: ['a'] }).colunas,
    new Set(['novo']),
  );
});

test('aplicarNaColuna não cria coluna que ainda não carregou', () => {
  const releitura = { itens: [card('a', '10', { colunaRef: 'novo' })], ausentes: [] };

  assert.equal(aplicarNaColuna(undefined, 'novo', releitura), undefined);
});

test('aplicarNaColuna tira os ausentes e o que foi para outra coluna', () => {
  const dados = paginas({ itens: [card('a', '12'), card('b', '11'), card('c', '10')] });
  const releitura = { itens: [card('b', '13', { colunaRef: 'proposta' })], ausentes: ['c'] };

  assert.deepEqual(ids(aplicarNaColuna(dados, 'novo', releitura)), [['a']]);
});

test('aplicarNaColuna leva o card atualizado à posição da ordem padrão', () => {
  const dados = paginas({ itens: [card('a', '12'), card('b', '11'), card('c', '10')] });
  const atualizado = card('c', '13', { colunaRef: 'novo', titulo: 'Novo nome' });
  const resultado = aplicarNaColuna(dados, 'novo', { itens: [atualizado], ausentes: [] });

  assert.deepEqual(ids(resultado), [['c', 'a', 'b']]);
  assert.equal(resultado.pages[0].itens[0].titulo, 'Novo nome');
});

test('aplicarNaColuna respeita a ordem crescente', () => {
  const dados = paginas({ itens: [card('a', '10'), card('b', '12')] });
  const novo = card('c', '11', { colunaRef: 'novo' });
  const releitura = { itens: [novo], ausentes: [] };

  assert.deepEqual(ids(aplicarNaColuna(dados, 'novo', releitura, MAIS_ANTIGOS_PRIMEIRO)), [
    ['a', 'c', 'b'],
  ]);
});

test('aplicarNaColuna acha a posição na página certa', () => {
  const dados = paginas(
    { itens: [card('a', '14'), card('b', '13')], proximoCursor: 'x' },
    { itens: [card('c', '11')] },
  );
  const releitura = { itens: [card('d', '12', { colunaRef: 'novo' })], ausentes: [] };

  assert.deepEqual(ids(aplicarNaColuna(dados, 'novo', releitura)), [
    ['a', 'b'],
    ['d', 'c'],
  ]);
});

test('aplicarNaColuna deixa para o "Carregar mais" o card depois do que carregou', () => {
  const dados = paginas({ itens: [card('a', '14')], proximoCursor: 'x' });
  const releitura = { itens: [card('b', '10', { colunaRef: 'novo' })], ausentes: [] };

  assert.deepEqual(ids(aplicarNaColuna(dados, 'novo', releitura)), [['a']]);
});

test('aplicarNaColuna põe no fim quando não há mais páginas', () => {
  const dados = paginas({ itens: [card('a', '14')] });
  const releitura = { itens: [card('b', '10', { colunaRef: 'novo' })], ausentes: [] };

  assert.deepEqual(ids(aplicarNaColuna(dados, 'novo', releitura)), [['a', 'b']]);
});

test('aplicarNaColuna põe o card na coluna vazia', () => {
  const releitura = { itens: [card('a', '10', { colunaRef: 'novo' })], ausentes: [] };

  assert.deepEqual(ids(aplicarNaColuna(paginas({ itens: [] }), 'novo', releitura)), [['a']]);
});

test('aplicarNaColuna, fora da ordem por atualização, mantém o lugar do card', () => {
  const dados = paginas({ itens: [card('a', '12'), card('b', '11')] });
  const atualizado = card('b', '13', { colunaRef: 'novo', titulo: 'Novo nome' });
  const resultado = aplicarNaColuna(
    dados,
    'novo',
    { itens: [atualizado], ausentes: [] },
    ORDEM_POR_NOME,
  );

  assert.deepEqual(ids(resultado), [['a', 'b']]);
  assert.equal(resultado.pages[0].itens[1].titulo, 'Novo nome');
});

test('aplicarNaColuna, fora da ordem por atualização, põe no topo o card que chegou', () => {
  const dados = paginas({ itens: [card('a', '12')] });
  const releitura = { itens: [card('b', '11', { colunaRef: 'novo' })], ausentes: [] };

  assert.deepEqual(ids(aplicarNaColuna(dados, 'novo', releitura, ORDEM_POR_NOME)), [['b', 'a']]);
});

test('cardsDasPaginas não repete o card que voltou no "Carregar mais"', () => {
  const dados = paginas(
    { itens: [card('a', '12'), card('b', '11')] },
    { itens: [card('a', '12')] },
  );

  assert.deepEqual(
    cardsDasPaginas(dados).map((item) => item.entidadeId),
    ['a', 'b'],
  );

  assert.deepEqual(cardsDasPaginas(undefined), []);
});
