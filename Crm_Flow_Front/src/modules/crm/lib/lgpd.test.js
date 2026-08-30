import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MENSAGEM_LOTE,
  confirmacaoBate,
  exigeLote,
  problemaDoLote,
  resumoDaAnonimizacao,
  textoDeConfirmacao,
} from './lgpd.js';

test('confirmação: o nome do lead, ou ANONIMIZAR sem nome', () => {
  assert.equal(textoDeConfirmacao({ nome: ' Ana Souza ' }), 'Ana Souza');
  assert.equal(textoDeConfirmacao({ nome: '' }), 'ANONIMIZAR');
  assert.equal(confirmacaoBate(' Ana Souza ', 'Ana Souza'), true);
  assert.equal(confirmacaoBate('ana souza', 'Ana Souza'), false);
});

test('resumo da anonimização no singular e no plural', () => {
  assert.equal(
    resumoDaAnonimizacao({ leadId: 'l', leads: 1, atividades: 3, eventos: 1 }),
    'Lead anonimizado (1 lead, 3 atividades, 1 evento).',
  );
});

test('lote obrigatório só com a base obrigatória e sem coluna mapeada', () => {
  assert.equal(exigeLote({ obrigatoria: true }, { Nome: 'nome' }, 'baseLegal'), true);
  assert.equal(exigeLote({ obrigatoria: true }, { Base: 'baseLegal' }, 'baseLegal'), false);
  assert.equal(exigeLote({ obrigatoria: false }, {}, 'baseLegal'), false);
  assert.equal(exigeLote(null, {}, 'baseLegal'), false);
});

test('o problema do lote some com a base escolhida', () => {
  assert.equal(problemaDoLote({ obrigatoria: true }, {}, '', 'baseLegal'), MENSAGEM_LOTE);
  assert.equal(problemaDoLote({ obrigatoria: true }, {}, 'consentimento', 'baseLegal'), null);
});
