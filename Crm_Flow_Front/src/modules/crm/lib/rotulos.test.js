import assert from 'node:assert/strict';
import { test } from 'node:test';
import { humanizar, rotuloOpcao } from './rotulos.js';

test('traduz valores conhecidos das Camadas 1 e 2', () => {
  assert.equal(rotuloOpcao('em_contato'), 'Em contato');
  assert.equal(rotuloOpcao('trafego_pago', { camada: 1 }), 'Tráfego pago');
  assert.equal(rotuloOpcao('sem_orcamento', { camada: 2 }), 'Sem orçamento');
});

test('humaniza valor desconhecido', () => {
  assert.equal(rotuloOpcao('valor_novo_do_back'), 'Valor novo do back');
  assert.equal(humanizar('x'), 'X');
});

test('Camada 3 volta como o usuário escreveu', () => {
  assert.equal(rotuloOpcao('em_contato', { camada: 3 }), 'em_contato');
});

test('vazio vira string vazia', () => {
  assert.equal(rotuloOpcao(null), '');
  assert.equal(rotuloOpcao(''), '');
});
