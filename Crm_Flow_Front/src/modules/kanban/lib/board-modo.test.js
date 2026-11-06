import assert from 'node:assert/strict';
import { test } from 'node:test';
import { modoDoQuadro, quadrosNativos } from './board-modo.js';

test('sem modo, o quadro é nativo', () => {
  assert.equal(modoDoQuadro({ id: 'b1' }), 'nativo');
  assert.equal(modoDoQuadro({ quadroRef: 'q1', modo: 'entidade' }), 'entidade');
});

test('quadrosNativos tira só os de entidade', () => {
  const semModo = { id: 'b1', nome: 'Projetos' };
  const nativo = { id: 'b2', nome: 'Postagens', modo: 'nativo' };
  const entidade = {
    boardType: 'crm_oportunidades',
    quadroRef: 'q1',
    nome: 'Vendas',
    modo: 'entidade',
  };

  assert.deepEqual(quadrosNativos([semModo, entidade, nativo]), [semModo, nativo]);
});
