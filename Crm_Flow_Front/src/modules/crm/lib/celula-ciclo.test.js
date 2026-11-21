import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { textoDaCelulaCiclo } from './celula-ciclo.js';
import { COLUNAS_PADRAO, lerValorDaColuna, montarColunas } from './colunas.js';

const FUSO = 'America/Sao_Paulo';

function coluna(id, opcoes) {
  return montarColunas([], opcoes).find((item) => item.id === id);
}

function texto(id, lead, opcoes = { comDataConversao: true }) {
  const col = coluna(id, opcoes);
  return textoDaCelulaCiclo(col, lerValorDaColuna(lead, col), FUSO);
}

describe('célula do ciclo de vida (FC4)', () => {
  test('sem dataConversao, só Ciclo e Abertas; o chip diz "Cliente"', () => {
    const semData = { comDataConversao: false };
    const ids = montarColunas([], semData).map((item) => item.id);
    assert.equal(ids.includes('clienteDesde'), false);
    assert.equal(ids.includes('ultimaCompra'), false);
    assert.equal(ids.includes('cicloDeVida'), true);
    assert.equal(ids.includes('oportunidadesAbertas'), true);
    assert.equal(COLUNAS_PADRAO.includes('cicloDeVida'), false);

    const lead = { ciclo_de_vida: 'cliente', oportunidades_abertas: 1 };
    assert.equal(texto('cicloDeVida', lead, semData), 'Cliente');
  });

  test('cada ciclo', () => {
    assert.equal(texto('cicloDeVida', { ciclo_de_vida: 'lead' }), 'Lead');
    assert.equal(texto('cicloDeVida', { ciclo_de_vida: 'oportunidade' }), 'Em negociação');
    assert.equal(
      texto('cicloDeVida', { ciclo_de_vida: 'cliente', cliente_desde: '2026-03-10T14:00:00.000Z' }),
      'Cliente desde 03/2026',
    );
    assert.equal(
      texto('cicloDeVida', { ciclo_de_vida: 'cliente', cliente_desde: null }),
      'Cliente',
    );
  });

  test('ciclo ausente ou desconhecido não vira "Lead"', () => {
    assert.equal(texto('cicloDeVida', {}), null);
    assert.equal(texto('cicloDeVida', { ciclo_de_vida: 'vip' }), null);
  });

  test('datas no fuso; ausente ou null fica vazio', () => {
    assert.equal(texto('clienteDesde', { cliente_desde: '2026-03-10T14:00:00.000Z' }), '03/2026');
    assert.equal(
      texto('ultimaCompra', { ultima_compra: '2026-10-02T17:20:00.000Z' }),
      '02/10/2026',
    );
    assert.equal(texto('ultimaCompra', {}), null);
    assert.equal(texto('clienteDesde', { cliente_desde: null }), null);
  });

  test('oportunidades_abertas: 0 mostra "0"; ausente fica vazio', () => {
    assert.equal(texto('oportunidadesAbertas', { oportunidades_abertas: 0 }), '0');
    assert.equal(texto('oportunidadesAbertas', { oportunidades_abertas: 3 }), '3');
    assert.equal(texto('oportunidadesAbertas', {}), null);
  });
});
