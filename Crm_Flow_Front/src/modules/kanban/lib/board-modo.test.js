import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ehQuadroDeEntidade,
  modoDoQuadro,
  quadrosDaGaleria,
  quadrosNativos,
  rotaDoQuadro,
} from './board-modo.js';

test('sem modo, o quadro é nativo', () => {
  assert.equal(modoDoQuadro({ id: 'b1' }), 'nativo');
  assert.equal(modoDoQuadro({ quadroRef: 'q1', modo: 'entidade' }), 'entidade');
});

test('rotaDoQuadro leva cada quadro à sua tela', () => {
  const pipeline = { boardType: 'crm_oportunidades', quadroRef: 'p1', modo: 'entidade' };

  assert.equal(rotaDoQuadro({ id: 'b1' }), '/kanban?quadro=b1');
  assert.equal(rotaDoQuadro(pipeline), '/kanban/pipeline/p1');
  assert.equal(ehQuadroDeEntidade(pipeline), true);
});

test('a galeria mostra nativos e entidades com tela', () => {
  const nativo = { id: 'b1' };
  const pipeline = { boardType: 'crm_oportunidades', quadroRef: 'p1', modo: 'entidade' };
  const semTela = { boardType: 'outro', quadroRef: 'x', modo: 'entidade' };

  assert.deepEqual(quadrosDaGaleria([nativo, pipeline, semTela]), [nativo, pipeline]);
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
