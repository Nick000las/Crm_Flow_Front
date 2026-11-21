import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  CHAVES_DATA_CICLO,
  CHAVES_FIXAS_CICLO,
  comDataConversao,
  filtroComDataConversao,
  formatarDiaNoFuso,
  formatarMesAno,
  textoDoCiclo,
} from './ciclo-de-vida.js';

describe('formatadores no fuso', () => {
  test('a virada do dia em UTC ainda é o dia anterior em São Paulo', () => {
    const iso = '2026-03-01T02:00:00.000Z';

    assert.equal(formatarMesAno(iso), '02/2026');
    assert.equal(formatarDiaNoFuso(iso), '28/02/2026');
    assert.equal(formatarMesAno(iso, 'UTC'), '03/2026');
    assert.equal(formatarDiaNoFuso(iso, 'UTC'), '01/03/2026');
  });

  test('formata o exemplo do contrato', () => {
    assert.equal(formatarMesAno('2026-03-10T14:00:00.000Z'), '03/2026');
    assert.equal(formatarDiaNoFuso('2026-10-02T17:20:00.000Z'), '02/10/2026');
  });

  test('ausente ou inválido dá null', () => {
    for (const valor of [null, undefined, '', 'ontem', 0, {}]) {
      assert.equal(formatarMesAno(valor), null);
      assert.equal(formatarDiaNoFuso(valor), null);
    }
  });

  test('fuso inválido cai no padrão', () => {
    assert.equal(formatarDiaNoFuso('2026-03-01T02:00:00.000Z', 'Lua/Base'), '28/02/2026');
  });
});

test('comDataConversao: sem /fields ainda, vale; depois, só com a chave', () => {
  assert.equal(comDataConversao(undefined), true);
  assert.equal(comDataConversao([{ chave: 'nome' }]), false);
  assert.equal(comDataConversao([{ chave: 'nome' }, { chave: 'dataConversao' }]), true);
});

describe('textoDoCiclo', () => {
  test('cada ciclo tem o seu texto', () => {
    assert.deepEqual(textoDoCiclo({ ciclo_de_vida: 'lead' }), { ciclo: 'lead', texto: 'Lead' });
    assert.deepEqual(textoDoCiclo({ ciclo_de_vida: 'oportunidade' }), {
      ciclo: 'oportunidade',
      texto: 'Em negociação',
    });
    assert.deepEqual(
      textoDoCiclo({ ciclo_de_vida: 'cliente', cliente_desde: '2026-03-10T14:00:00.000Z' }),
      { ciclo: 'cliente', texto: 'Cliente desde 03/2026' },
    );
  });

  test('cliente sem cliente_desde (papel sem dataConversao) é só "Cliente"', () => {
    assert.equal(textoDoCiclo({ ciclo_de_vida: 'cliente' }).texto, 'Cliente');
    assert.equal(textoDoCiclo({ ciclo_de_vida: 'cliente', cliente_desde: null }).texto, 'Cliente');
  });

  test('cliente_desde no fuso do tenant', () => {
    const lead = { ciclo_de_vida: 'cliente', cliente_desde: '2026-03-01T02:00:00.000Z' };

    assert.equal(textoDoCiclo(lead).texto, 'Cliente desde 02/2026');
    assert.equal(textoDoCiclo(lead, 'UTC').texto, 'Cliente desde 03/2026');
  });

  test('ausente ou desconhecido nunca vira "Lead"', () => {
    assert.equal(textoDoCiclo({}), null);
    assert.equal(textoDoCiclo({ ciclo_de_vida: null }), null);
    assert.equal(textoDoCiclo({ ciclo_de_vida: 'prospect' }), null);
    assert.equal(textoDoCiclo({ ciclo_de_vida: 'toString' }), null);
    assert.equal(textoDoCiclo(null), null);
  });
});

test('chaves do ciclo no filtro', () => {
  assert.deepEqual(CHAVES_DATA_CICLO, [
    'clienteDesdeDe',
    'clienteDesdeAte',
    'ultimaCompraDe',
    'ultimaCompraAte',
  ]);
  assert.equal(CHAVES_FIXAS_CICLO.length, 7);
  assert.ok(CHAVES_FIXAS_CICLO.includes('cicloDeVida'));
});

test('filtroComDataConversao tira só as datas do ciclo, e só sem o gate', () => {
  const filtro = {
    filtros: [],
    cicloDeVida: ['cliente'],
    clienteDesdeDe: '2026-01-01',
    clienteDesdeAte: '2026-01-31',
    ultimaCompraDe: '2026-02-01',
    ultimaCompraAte: '2026-02-28',
    oportunidadesAbertasMin: 0,
    criadoDe: '2026-01-01',
  };

  assert.equal(filtroComDataConversao(filtro, true), filtro);
  assert.deepEqual(filtroComDataConversao(filtro, false), {
    filtros: [],
    cicloDeVida: ['cliente'],
    oportunidadesAbertasMin: 0,
    criadoDe: '2026-01-01',
  });
});
