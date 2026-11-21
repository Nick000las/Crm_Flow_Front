import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CICLOS_DE_VIDA } from '../constants.js';
import {
  MENSAGENS_CICLO,
  ORDEM_CICLOS,
  ROTULOS_CICLO,
  ROTULOS_COLUNA_CICLO,
  TEXTOS_FILTRO_CICLO,
  textoClienteDesde,
} from './ciclo-textos.js';

test('cada ciclo de vida tem rótulo e aparece uma vez na ordem da tela', () => {
  const valores = Object.values(CICLOS_DE_VIDA);

  assert.deepEqual(Object.keys(ROTULOS_CICLO).sort(), [...valores].sort());
  assert.deepEqual(ROTULOS_CICLO, {
    lead: 'Lead',
    oportunidade: 'Em negociação',
    cliente: 'Cliente',
  });
  assert.deepEqual(ORDEM_CICLOS, ['lead', 'oportunidade', 'cliente']);
});

test('textoClienteDesde monta o chip com o mês e ano já formatados', () => {
  assert.equal(textoClienteDesde('03/2026'), 'Cliente desde 03/2026');
});

test('cabeçalhos, legendas e mensagens do ciclo de vida', () => {
  assert.deepEqual(ROTULOS_COLUNA_CICLO, {
    cicloDeVida: 'Ciclo de vida',
    clienteDesde: 'Cliente desde',
    ultimaCompra: 'Última compra',
    oportunidadesAbertas: 'Oportunidades abertas',
  });
  assert.equal(TEXTOS_FILTRO_CICLO.prefixoChip, 'Ciclo');
  assert.equal(TEXTOS_FILTRO_CICLO.ultimaCompra, 'Última compra');
  assert.equal(MENSAGENS_CICLO.DATA_INVERTIDA, 'A data inicial não pode ser depois da final');
  assert.equal(MENSAGENS_CICLO.MIN_MAIOR, 'O mínimo não pode ser maior que o máximo');
  assert.equal(MENSAGENS_CICLO.INTEIRO, 'Use um número inteiro a partir de 0');
});
