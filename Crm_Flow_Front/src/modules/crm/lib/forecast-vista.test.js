import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  cardsDosBlocos,
  celulaDaLista,
  colunasDaLista,
  dinheiro,
  linhasDosGrupos,
  semResultado,
  serieDoGrafico,
} from './forecast-vista.js';

const MES = {
  mes: '2026-11',
  realizado: { quantidade: 2, soma: 3000.5 },
  ponderado: { quantidade: 3, soma: 1200.25 },
  melhorCaso: { soma: 4000 },
  previsto: 4200.75,
  ganhasSemValor: 2,
};

const MES_SEM_VALOR = {
  mes: '2026-12',
  realizado: { quantidade: 1, soma: null },
  ponderado: { quantidade: 4, soma: null },
  melhorCaso: { soma: null },
  previsto: null,
  ganhasSemValor: 0,
};

const BLOCOS = {
  atrasadas: { quantidade: 1, soma: 500, ponderado: 200 },
  antesDoPeriodo: { quantidade: 0, soma: 0, ponderado: 0 },
  semPrevisao: { quantidade: 0, soma: 0, ponderado: 0 },
  alemDoHorizonte: { quantidade: 2, soma: 100, ponderado: 50 },
  semValor: { quantidade: 3 },
};

const BLOCOS_NULOS = {
  atrasadas: { quantidade: 1, soma: null, ponderado: null },
  antesDoPeriodo: { quantidade: 1, soma: null, ponderado: null },
  semPrevisao: { quantidade: 0, soma: null, ponderado: null },
  alemDoHorizonte: { quantidade: 2, soma: null, ponderado: null },
  semValor: { quantidade: 3 },
};

test('dinheiro: null e undefined viram null, nunca R$ 0,00', () => {
  assert.equal(dinheiro(null), null);
  assert.equal(dinheiro(undefined), null);
  assert.match(dinheiro(3000.5), /3\.000,50/);
});

test('serieDoGrafico com valor: soma da API, mês atual pelo hoje e tooltip', () => {
  const { modo, pontos } = serieDoGrafico([MES, MES_SEM_VALOR], {
    veValor: true,
    hoje: '2026-11-19',
  });
  assert.equal(modo, 'valor');
  assert.equal(pontos[0].atual, true);
  assert.equal(pontos[1].atual, false);
  assert.equal(pontos[0].realizado, 3000.5);
  assert.equal(pontos[0].emAberto, 1200.25);
  assert.equal(pontos[0].melhorCaso, 4000);
  assert.equal(pontos[0].rotulo, 'nov/26');
  assert.equal(pontos[0].rotuloLongo, 'novembro de 2026');
  assert.match(pontos[0].tooltip[0].texto, /3\.000,50.* · 2$/);
  assert.deepEqual(
    pontos[0].tooltip.map((t) => t.rotulo),
    ['Realizado', 'Ponderado', 'Melhor caso', 'Previsto'],
  );
  assert.equal(pontos[0].avisoSemValor, '2 vendas sem valor não entram na soma');
  assert.equal(pontos[1].avisoSemValor, null);
});

test('serieDoGrafico com valor nulo: gráfico null e tooltip com traço, nunca 0', () => {
  const { pontos } = serieDoGrafico([MES_SEM_VALOR], { veValor: true, hoje: '2026-11-19' });
  const [p] = pontos;
  assert.equal(p.realizado, null);
  assert.equal(p.emAberto, null);
  assert.equal(p.melhorCaso, null);
  assert.equal(p.tooltip[0].texto, '— · 1');
  assert.equal(p.tooltip[2].texto, '—');
  assert.equal(p.tooltip[3].texto, '—');
  assert.ok(!JSON.stringify(p).includes('R$'));
});

test('serieDoGrafico sem valor: contagens, sem R$ e sem melhor caso', () => {
  const { modo, pontos } = serieDoGrafico([MES_SEM_VALOR, MES], {
    veValor: false,
    hoje: '2026-11-19',
  });
  assert.equal(modo, 'contagem');
  assert.equal(pontos[0].realizado, 1);
  assert.equal(pontos[0].emAberto, 4);
  assert.equal(pontos[0].melhorCaso, null);
  assert.deepEqual(pontos[0].tooltip, [
    { rotulo: 'Realizado', texto: '1 oportunidade' },
    { rotulo: 'Em aberto', texto: '4 oportunidades' },
  ]);
  assert.equal(pontos[1].melhorCaso, null);
  assert.ok(!JSON.stringify(pontos).includes('R$'));
});

test('cardsDosBlocos: ordem, alerta e antesDoPeriodo escondido com 0', () => {
  const cards = cardsDosBlocos(BLOCOS, true);
  assert.deepEqual(
    cards.map((c) => c.chave),
    ['atrasadas', 'semPrevisao', 'alemDoHorizonte', 'semValor'],
  );
  assert.deepEqual(
    cards.map((c) => c.alerta),
    [true, true, false, false],
  );
  assert.deepEqual(
    cards.map((c) => c.clicavel),
    [true, false, true, true],
  );
  assert.match(cards[0].soma, /500,00/);
  assert.match(cards[0].ponderado, /200,00/);
  assert.equal(cards[3].soma, null);
  assert.equal(cards[3].ponderado, null);
});

test('cardsDosBlocos: antesDoPeriodo aparece com quantidade > 0, na terceira posição', () => {
  const cards = cardsDosBlocos(
    { ...BLOCOS, antesDoPeriodo: { quantidade: 2, soma: 10, ponderado: 5 } },
    true,
  );
  assert.deepEqual(
    cards.map((c) => c.chave),
    ['atrasadas', 'semPrevisao', 'antesDoPeriodo', 'alemDoHorizonte', 'semValor'],
  );
});

test('cardsDosBlocos sem valor: soma e ponderado null, sem R$', () => {
  const cards = cardsDosBlocos(BLOCOS, false);
  for (const c of cards) {
    assert.equal(c.soma, null);
    assert.equal(c.ponderado, null);
  }
  assert.ok(!JSON.stringify(cards).includes('R$'));
  assert.equal(cards[0].quantidade, 1);
});

test('cardsDosBlocos com valor nulo no bloco não vira R$ 0,00', () => {
  const [atrasadas] = cardsDosBlocos(BLOCOS_NULOS, true);
  assert.equal(atrasadas.soma, null);
  assert.equal(atrasadas.ponderado, null);
});

test('colunasDaLista: some só quando a chave não existe em nenhum item', () => {
  const completo = {
    pessoa: 'Ana',
    statusLabel: 'Proposta',
    valor: 10,
    probabilidadeEfetiva: 50,
    ponderado: 5,
    dataPrevistaFechamento: '2026-12-10',
    ganhaEm: null,
    responsavelId: null,
  };
  const ids = (itens) => colunasDaLista(itens).map((c) => c.id);

  assert.deepEqual(ids([completo]), [
    'pessoa',
    'status',
    'valor',
    'probabilidade',
    'ponderado',
    'dataPrevista',
    'responsavel',
  ]);

  const semValor = { ...completo };
  delete semValor.valor;
  delete semValor.ponderado;
  assert.deepEqual(ids([semValor, semValor]), [
    'pessoa',
    'status',
    'probabilidade',
    'dataPrevista',
    'responsavel',
  ]);
  // valor falta só em um item: a coluna fica.
  assert.ok(ids([semValor, completo]).includes('valor'));
  assert.ok(ids([semValor, completo]).includes('ponderado'));

  const semStatus = { ...completo };
  delete semStatus.statusLabel;
  assert.deepEqual(ids([semStatus]), [
    'pessoa',
    'valor',
    'probabilidade',
    'ponderado',
    'dataPrevista',
    'responsavel',
  ]);
});

test('colunasDaLista: ganhaEm só com alguma data preenchida', () => {
  const item = { pessoa: 'A', responsavelId: null, ganhaEm: '2026-11-01T10:00:00.000Z' };
  assert.ok(colunasDaLista([item]).some((c) => c.id === 'ganhaEm'));
  assert.ok(!colunasDaLista([{ ...item, ganhaEm: null }]).some((c) => c.id === 'ganhaEm'));
  assert.deepEqual(
    colunasDaLista([]).map((c) => c.id),
    ['pessoa', 'responsavel'],
  );
});

test('celulaDaLista: null continua null; valores formatados', () => {
  const nomes = new Map([['u1', 'Maria']]);
  const item = {
    pessoa: 'Ana',
    valor: null,
    ponderado: null,
    probabilidadeEfetiva: 60,
    dataPrevistaFechamento: '2026-12-10',
    ganhaEm: null,
    responsavelId: 'u1',
  };
  assert.equal(celulaDaLista(item, 'valor', nomes), null);
  assert.equal(celulaDaLista(item, 'ponderado', nomes), null);
  assert.equal(celulaDaLista(item, 'probabilidade', nomes), '60%');
  assert.equal(celulaDaLista(item, 'dataPrevista', nomes), '10/12/2026');
  assert.equal(celulaDaLista(item, 'ganhaEm', nomes), null);
  assert.equal(celulaDaLista(item, 'responsavel', nomes), 'Maria');
  assert.equal(
    celulaDaLista({ ...item, responsavelId: null }, 'responsavel', nomes),
    'Sem responsável',
  );
  assert.equal(
    celulaDaLista({ ...item, responsavelId: '12345678-aaaa' }, 'responsavel', nomes),
    '12345678',
  );
  assert.equal(celulaDaLista({ ...item, probabilidadeEfetiva: 0 }, 'probabilidade', nomes), '0%');
  assert.match(celulaDaLista({ ...item, valor: 1000 }, 'valor', nomes), /1\.000,00/);
});

test('linhasDosGrupos: previsto é a soma dos meses da API; um null anula tudo', () => {
  const grupo = (previstos) => ({
    chave: 'u1',
    rotulo: 'Maria',
    blocos: {},
    meses: previstos.map((previsto, i) => ({
      mes: `2026-1${i}`,
      realizado: { quantidade: 1, soma: 1 },
      ponderado: { quantidade: 1, soma: 1 },
      melhorCaso: { soma: 1 },
      previsto,
      ganhasSemValor: 0,
    })),
  });

  const [ok] = linhasDosGrupos([grupo([100, 50.5])], true);
  assert.match(ok.previsto, /150,50/);
  assert.equal(ok.quantidade, 4);
  assert.match(ok.meses[0].texto, /100,00/);

  const [nulo] = linhasDosGrupos([grupo([100, null])], true);
  assert.equal(nulo.previsto, null);
  assert.equal(nulo.meses[1].texto, null);
});

test('linhasDosGrupos sem valor: contagens e nenhum R$', () => {
  const linhas = linhasDosGrupos(
    [{ chave: null, rotulo: 'Sem responsável', blocos: {}, meses: [MES_SEM_VALOR] }],
    false,
  );
  assert.equal(linhas[0].previsto, null);
  assert.equal(linhas[0].meses[0].texto, '5');
  assert.ok(!JSON.stringify(linhas).includes('R$'));
});

test('semResultado: zerado por filtro sim; vazio do tenant não', () => {
  const zerado = {
    vazio: false,
    meses: [
      { ...MES, realizado: { quantidade: 0, soma: 0 }, ponderado: { quantidade: 0, soma: 0 } },
    ],
    blocos: {
      atrasadas: { quantidade: 0 },
      antesDoPeriodo: { quantidade: 0 },
      semPrevisao: { quantidade: 0 },
      alemDoHorizonte: { quantidade: 0 },
      semValor: { quantidade: 0 },
    },
  };
  assert.equal(semResultado(zerado), true);
  assert.equal(semResultado({ ...zerado, vazio: true }), false);
  assert.equal(
    semResultado({ ...zerado, blocos: { ...zerado.blocos, atrasadas: { quantidade: 1 } } }),
    false,
  );
  assert.equal(semResultado({ ...zerado, meses: [MES] }), false);
});
