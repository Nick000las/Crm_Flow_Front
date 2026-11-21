import assert from 'node:assert/strict';
import { test } from 'node:test';
import { linhasPorResponsavel, mesDaTabela, serieDaAssertividade } from './assertividade-vista.js';

const mes = (extra) => ({
  mes: '2026-10',
  semDados: false,
  snapshot: { semana: '2026-10-05', tiradoEm: '2026-10-05T09:00:00.000Z' },
  previsto: 12000.5,
  realizadoNoSnapshot: 2000,
  ponderadoNoSnapshot: 10000.5,
  realizado: 11000,
  assertividade: 0.9166,
  porResponsavel: [],
  ...extra,
});

const semDados = (m = '2026-09') =>
  mes({
    mes: m,
    semDados: true,
    snapshot: null,
    previsto: null,
    realizadoNoSnapshot: null,
    ponderadoNoSnapshot: null,
    realizado: 9000,
    assertividade: null,
  });

test('mês semDados: sem previsto, sem porcentagem, sem zero inventado', () => {
  const [p] = serieDaAssertividade([semDados()], null).pontos;
  assert.equal(p.previsto, null);
  assert.equal(p.rotuloPct, null);
  assert.equal(p.faixa, null);
  assert.equal(p.rotuloFaixa, null);
  assert.equal(p.realizado, 9000);
  const texto = JSON.stringify(p.tooltip);
  assert.ok(!texto.includes('0%'));
  assert.ok(!texto.includes('R$ 0'));
  assert.ok(!p.tooltip.some((l) => l.rotulo === 'Previsto'));
  assert.ok(p.tooltip.some((l) => l.rotulo === 'Realizado'));
  assert.ok(p.tooltip.some((l) => l.rotulo === 'Sem dados ainda'));
});

test('razão nula com previsto 0 vira traço e sem faixa', () => {
  const [p] = serieDaAssertividade(
    [mes({ previsto: 0, realizadoNoSnapshot: 0, ponderadoNoSnapshot: 0, assertividade: null })],
    null,
  ).pontos;
  assert.equal(p.rotuloPct, '—');
  assert.equal(p.faixa, null);
  assert.equal(p.rotuloFaixa, null);
  assert.equal(p.tooltip.at(-1).texto, '—');
});

test('ordem invertida e mês aberto', () => {
  const { pontos } = serieDaAssertividade(
    [mes({ mes: '2026-10' }), semDados('2026-09'), mes({ mes: '2026-08' })],
    '2026-09',
  );
  assert.deepEqual(
    pontos.map((p) => p.mes),
    ['2026-08', '2026-09', '2026-10'],
  );
  assert.deepEqual(
    pontos.map((p) => p.aberto),
    [false, true, false],
  );
});

test('limites 0,8 e 1,2 são boa', () => {
  const faixa = (a) => serieDaAssertividade([mes({ assertividade: a })], null).pontos[0].faixa;
  assert.deepEqual([faixa(0.8), faixa(1.2)], ['boa', 'boa']);
  assert.deepEqual([faixa(0.79), faixa(1.21)], ['otimista', 'pessimista']);
});

test('0,9166 vira 92% no rótulo e 91,66% no tooltip', () => {
  const [p] = serieDaAssertividade([mes()], null).pontos;
  assert.equal(p.rotuloPct, '92%');
  assert.equal(p.rotuloFaixa, 'Dentro do esperado');
  assert.equal(p.tooltip.at(-1).texto, '91,66%');
  assert.ok(p.tooltip.some((l) => l.rotulo === 'Semana da foto' && l.texto === '05/10/2026'));
  assert.ok(p.tooltip.some((l) => l.rotulo === 'Previsto'));
});

test('responsável com previsto 0 e razão nula: pct traço', () => {
  const m = mes({
    porResponsavel: [
      {
        responsavelId: 'u1',
        rotulo: 'Maria',
        previsto: 8000,
        realizado: 7000,
        assertividade: 0.875,
      },
      {
        responsavelId: null,
        rotulo: 'Sem responsável',
        previsto: 0,
        realizado: 500,
        assertividade: null,
      },
    ],
  });
  const [a, b] = linhasPorResponsavel(m);
  assert.equal(a.chave, 'u1');
  assert.equal(a.pct, '87,50%');
  assert.equal(a.faixa, 'boa');
  assert.equal(b.chave, 'Sem responsável');
  assert.equal(b.pct, '—');
  assert.equal(b.faixa, null);
  assert.equal(b.rotuloFaixa, null);
});

test('linhasPorResponsavel de mês semDados é vazio', () => {
  assert.deepEqual(linhasPorResponsavel(semDados()), []);
  assert.deepEqual(linhasPorResponsavel(null), []);
});

test('mesDaTabela', () => {
  const meses = [mes({ mes: '2026-10' }), semDados('2026-09')];
  assert.equal(mesDaTabela(meses, '2026-09').mes, '2026-09');
  assert.equal(mesDaTabela(meses, '2026-01'), null);
  assert.equal(mesDaTabela(meses, null), null);
});
