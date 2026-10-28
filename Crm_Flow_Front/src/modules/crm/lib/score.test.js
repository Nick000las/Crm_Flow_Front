import assert from 'node:assert/strict';
import { test } from 'node:test';
import { errosPorItem } from './erros-de-lista.js';
import {
  MENSAGENS_SCORE,
  chaveDaConfig,
  faixaDoScore,
  filtroComScore,
  novaFaixa,
  novaRegraScore,
  scoreMudou,
  scoreParaEnvio,
  textoDoRecalculo,
  textoDosPontos,
  valoresDoScore,
} from './score.js';

const ORIGEM = {
  id: 'f-origem',
  chave: 'fonteLead',
  label: 'Origem',
  tipo: 'selecao',
  camada: 1,
  coluna: 'fonte_lead',
  opcoes: ['site'],
  opcoesLista: [{ key: 'site', label: 'Site', color: null, category: null, ativo: true }],
};
const CAMPOS = [ORIGEM];

const PADRAO = [
  { chave: 'frio', rotulo: 'Frio', minimo: null, maximo: 29, cor: '#3B82F6' },
  { chave: 'morno', rotulo: 'Morno', minimo: 30, maximo: 69, cor: '#F59E0B' },
  { chave: 'quente', rotulo: 'Quente', minimo: 70, maximo: null, cor: '#EF4444' },
];

const CONFIG = {
  regras: [
    {
      id: 'r1',
      nome: 'Veio do site',
      ativo: true,
      pontos: 20,
      condicoes: [{ campoId: 'f-origem', operador: 'igual', valor: 'site' }],
    },
  ],
  faixas: PADRAO,
  faixasConfiguradas: false,
  recalculo: null,
};

test('faixaDoScore: string decimal, negativo, limites inclusivos e sem score', () => {
  assert.equal(faixaDoScore(PADRAO, '82.00')?.chave, 'quente');
  assert.equal(faixaDoScore(PADRAO, '-15')?.chave, 'frio');
  assert.equal(faixaDoScore(PADRAO, 29)?.chave, 'frio');
  assert.equal(faixaDoScore(PADRAO, '30')?.chave, 'morno');
  assert.equal(faixaDoScore(PADRAO, null), null);
  assert.equal(faixaDoScore(null, 50), null);
  assert.equal(faixaDoScore([{ chave: 'a', rotulo: 'A', minimo: 0, maximo: 10, cor: '#000000' }], 50), null);
});

test('ida e volta: regra sem id, faixa salva mantém a chave, nova vai sem', () => {
  const valores = valoresDoScore(CONFIG, CAMPOS);
  assert.equal(scoreMudou(valores, CONFIG, CAMPOS), false);

  const comNova = {
    ...valores,
    faixas: [...valores.faixas.slice(0, 2), { ...novaFaixa('n1'), rotulo: 'Muito quente', minimo: '70', cor: '#000000' }],
  };
  const { corpo } = /** @type {any} */ (scoreParaEnvio(comNova, CAMPOS));

  assert.deepEqual(corpo.regras, [
    { nome: 'Veio do site', ativo: true, pontos: 20, condicoes: [{ campoId: 'f-origem', operador: 'igual', valor: 'site' }] },
  ]);
  assert.deepEqual(corpo.faixas[0], { chave: 'frio', rotulo: 'Frio', minimo: null, maximo: 29, cor: '#3B82F6' });
  assert.deepEqual(corpo.faixas[2], { rotulo: 'Muito quente', minimo: 70, maximo: null, cor: '#000000' });
  assert.equal(scoreMudou(comNova, CONFIG, CAMPOS), true);
});

test('validação: pontos, mínimo maior que o máximo, cor e sobreposição', () => {
  const valores = valoresDoScore(CONFIG, CAMPOS);
  const regraRuim = { ...novaRegraScore('n1'), nome: 'X', pontos: '1001' };
  const faixaRuim = { ...novaFaixa('n2'), rotulo: 'Y', minimo: '50', maximo: '10', cor: 'azul' };
  const { erros } = /** @type {any} */ (scoreParaEnvio({ regras: [regraRuim], faixas: [faixaRuim] }, CAMPOS));

  assert.equal(erros.regras.n1.pontos, MENSAGENS_SCORE.PONTOS);
  assert.equal(erros.faixas.n2.item, MENSAGENS_SCORE.MINIMO_MAIOR);
  assert.equal(erros.faixas.n2.cor, MENSAGENS_SCORE.COR);

  const sobrepostas = valores.faixas.map((faixa) => (faixa.chave === 'morno' ? { ...faixa, maximo: '75' } : faixa));
  const resultado = /** @type {any} */ (scoreParaEnvio({ regras: [], faixas: sobrepostas }, CAMPOS));
  assert.deepEqual(resultado.erros.geral, ['As faixas "Morno" e "Quente" se sobrepõem']);

  assert.deepEqual(
    /** @type {any} */ (scoreParaEnvio({ regras: [], faixas: [] }, CAMPOS)).erros.geral,
    [MENSAGENS_SCORE.SEM_FAIXA],
  );
});

test('400 das faixas volta para a faixa certa; o da lista, para o geral', () => {
  const { porItem, outros } = errosPorItem(
    { 'faixas.1.rotulo': ['Dê um nome à faixa'], 'faixas.0': ['"Frio": o mínimo passa do máximo'], faixas: ['Sobrepõem'] },
    'faixas',
    ['faixa-frio', 'faixa-morno'],
  );

  assert.deepEqual(porItem, {
    'faixa-morno': { rotulo: 'Dê um nome à faixa' },
    'faixa-frio': { item: '"Frio": o mínimo passa do máximo' },
  });
  assert.deepEqual(outros, ['Sobrepõem']);
});

test('textos: pontos com sinal e progresso do recálculo', () => {
  assert.equal(textoDosPontos('20'), '+20');
  assert.equal(textoDosPontos(-10), '-10');
  assert.equal(textoDosPontos('0'), '0');
  assert.equal(
    textoDoRecalculo({ total: 3000, processados: 1500, emAndamento: true, concluidoEm: null }),
    'Recalculando… 1.500 de 3.000 leads',
  );
  assert.equal(textoDoRecalculo(null), null);
});

test('chave da config ignora o progresso do recálculo', () => {
  const rodando = { ...CONFIG, recalculo: { total: 10, processados: 5, emAndamento: true, concluidoEm: null } };
  assert.equal(chaveDaConfig(CONFIG), chaveDaConfig(rodando));
});

test('sem a flag, faixaScore sai do filtro', () => {
  const filtro = { filtros: [], faixaScore: 'quente' };
  assert.deepEqual(filtroComScore(filtro, false), { filtros: [] });
  assert.equal(filtroComScore(filtro, true), filtro);
});
