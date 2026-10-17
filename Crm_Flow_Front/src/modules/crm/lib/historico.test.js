import assert from 'node:assert/strict';
import { test } from 'node:test';
import { autorDoEvento, fraseDoItem, frasesDoEvento } from './historico.js';

const NOMES = new Map([['u1', 'Ana']]);
const STATUS = {
  chave: 'status',
  label: 'Status',
  tipo: 'selecao',
  opcoesLista: [
    { key: 'novo', label: 'Novo', color: null, category: 'aberto', ativo: true },
    { key: 'ganho', label: 'Ganho', color: null, category: 'ganho', ativo: true },
  ],
};

const evento = (extra) => ({ id: 'e1', tipo: 'atualizado', autor: null, criadoEm: '2026-10-16T10:00:00Z', diff: [], ...extra });

test('autor nulo é o sistema', () => {
  assert.equal(autorDoEvento(evento({ autor: { id: 'u1', nome: 'Ana' } })), 'Ana');
  assert.equal(autorDoEvento(evento()), 'Sistema');
});

test('lista vira rótulo pela opcoesLista', () => {
  assert.equal(fraseDoItem({ ...STATUS, antes: 'novo', depois: 'ganho' }, NOMES), 'mudou Status de Novo para Ganho');
});

test('preencher e limpar', () => {
  const cidade = { chave: 'cidade', label: 'Cidade', tipo: 'texto' };

  assert.equal(fraseDoItem({ ...cidade, antes: null, depois: 'Recife' }, NOMES), 'preencheu Cidade com Recife');
  assert.equal(fraseDoItem({ ...cidade, antes: 'Recife', depois: '' }, NOMES), 'limpou Cidade (era Recife)');
});

test('estágio usa o nome do momento; responsável, o nome do usuário', () => {
  const estagio = { chave: 'funilEstagioId', label: 'Estágio', tipo: 'texto', antes: 'id-1', depois: 'id-2' };
  const responsavel = { chave: 'usuarioResponsavelId', label: 'Responsável', tipo: 'usuario' };

  assert.equal(
    fraseDoItem({ ...estagio, antesNome: 'Contato', depoisNome: 'Proposta' }, NOMES),
    'mudou Estágio de Contato para Proposta',
  );
  assert.equal(fraseDoItem({ ...responsavel, antes: null, depois: 'u1' }, NOMES), 'preencheu Responsável com Ana');
  assert.equal(
    fraseDoItem({ ...responsavel, antes: 'u9', depois: 'u1' }, NOMES),
    'mudou Responsável de usuário removido para Ana',
  );
});

test('monetário e booleano saem formatados; texto longo é resumido', () => {
  const valor = { chave: 'valor', label: 'Valor', tipo: 'monetario', antes: 10, depois: 1500.5 };
  const ativo = { chave: 'vip', label: 'VIP', tipo: 'booleano', antes: true, depois: false };
  const nota = { chave: 'obs', label: 'Obs', tipo: 'texto_longo', antes: null, depois: 'x'.repeat(200) };

  assert.match(fraseDoItem(valor, NOMES), /^mudou Valor de R\$\s10,00 para R\$\s1\.500,50$/);
  assert.equal(fraseDoItem(ativo, NOMES), 'mudou VIP de Sim para Não');
  assert.equal(fraseDoItem(nota, NOMES).length, 'preencheu Obs com '.length + 80);
});

test('frasesDoEvento: uma por campo, ou a do tipo', () => {
  assert.deepEqual(frasesDoEvento(evento({ diff: [{ ...STATUS, antes: 'novo', depois: 'ganho' }] }), NOMES), [
    'mudou Status de Novo para Ganho',
  ]);
  assert.deepEqual(frasesDoEvento(evento({ tipo: 'arquivado' }), NOMES), ['arquivou o lead']);
  assert.deepEqual(frasesDoEvento(evento({ tipo: 'criado' }), NOMES), ['criou o lead']);
  assert.deepEqual(frasesDoEvento(evento(), NOMES), ['atualizou o lead']);
  assert.deepEqual(frasesDoEvento(evento({ tipo: 'mesclado' }), NOMES), ['alterou o lead']);
});
