import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROLES } from '../../../lib/roles.js';
import { ApiError } from '../../../services/api-error.js';
import { ABAS_FORECAST, CRM_FEATURES } from '../constants.js';
import {
  erroDaAssertividade,
  escreverConsultaAssertividade,
  faixaDaAssertividade,
  lerConsultaAssertividade,
  mesPadraoDaLeitura,
  paramsDaAssertividade,
  porcentagem,
  textoDeLeitura,
  todosSemDados,
  ultimoMesFechado,
  validarPeriodoFechado,
} from './assertividade.js';
import { TEXTOS_ASSERTIVIDADE } from './assertividade-textos.js';
import { abaDaUrl, abasVisiveis, escreverAba } from './forecast-abas.js';
import { MENSAGENS_PERIODO } from './forecast.js';

const url = (texto) => new URLSearchParams(texto);
// O Intl separa "R$" do número com espaço não separável.
const normal = (texto) => texto.replaceAll(String.fromCharCode(0xa0), ' ');

const DONO = { role: ROLES.DONO, featuresAtivas: [CRM_FEATURES.FORECAST] };
const MASTER = { role: ROLES.MASTER, featuresAtivas: [CRM_FEATURES.FORECAST] };
const OPERADOR = { role: ROLES.OPERADOR, featuresAtivas: [CRM_FEATURES.FORECAST] };
const DONO_SEM_FLAG = { role: ROLES.DONO, featuresAtivas: [] };

const MES_NORMAL = Object.freeze({
  mes: '2026-10',
  semDados: false,
  snapshot: { semana: '2026-10-05', tiradoEm: '2026-10-05T09:00:00.000Z' },
  previsto: 12000.5,
  realizadoNoSnapshot: 2000,
  ponderadoNoSnapshot: 10000.5,
  realizado: 11000,
  assertividade: 0.9166,
  porResponsavel: [],
});
const MES_SEM_DADOS = Object.freeze({
  mes: '2026-09',
  semDados: true,
  snapshot: null,
  previsto: null,
  realizadoNoSnapshot: null,
  ponderadoNoSnapshot: null,
  realizado: 9000,
  assertividade: null,
  porResponsavel: [],
});
const MES_PREVISTO_ZERO = Object.freeze({
  mes: '2026-08',
  semDados: false,
  snapshot: { semana: '2026-08-03', tiradoEm: '2026-08-03T09:00:00.000Z' },
  previsto: 0,
  realizadoNoSnapshot: 0,
  ponderadoNoSnapshot: 0,
  realizado: 500,
  assertividade: null,
  porResponsavel: [],
});

test('porcentagem: razão × 100, null nunca vira 0%', () => {
  assert.equal(porcentagem(0.9166), '92%');
  assert.equal(porcentagem(0.9166, 2), '91,66%');
  assert.equal(porcentagem(1.25), '125%');
  assert.equal(porcentagem(0), '0%');
  assert.equal(porcentagem(null), null);
  assert.equal(porcentagem(undefined), null);
  assert.equal(porcentagem(Number.NaN), null);
  assert.equal(porcentagem(Number.POSITIVE_INFINITY), null);
});

test('faixaDaAssertividade: 0.8 e 1.2 são boa', () => {
  assert.equal(faixaDaAssertividade(0.7999), 'otimista');
  assert.equal(faixaDaAssertividade(0.8), 'boa');
  assert.equal(faixaDaAssertividade(1), 'boa');
  assert.equal(faixaDaAssertividade(1.2), 'boa');
  assert.equal(faixaDaAssertividade(1.2001), 'pessimista');
  assert.equal(faixaDaAssertividade(0), 'otimista');
  assert.equal(faixaDaAssertividade(null), null);
  assert.equal(faixaDaAssertividade(undefined), null);
});

test('ultimoMesFechado: virada de ano depende do fuso', () => {
  const agora = new Date('2027-01-01T02:00:00Z');
  // Em São Paulo ainda é 31/12/2026.
  assert.equal(ultimoMesFechado('America/Sao_Paulo', agora), '2026-11');
  assert.equal(ultimoMesFechado('UTC', agora), '2026-12');
  assert.equal(ultimoMesFechado('', agora), '2026-11');
  assert.equal(ultimoMesFechado(null, agora), '2026-11');
  assert.equal(ultimoMesFechado('Fuso/Inexistente', agora), '2026-11');
  assert.equal(ultimoMesFechado('UTC', new Date('2026-11-20T12:00:00Z')), '2026-10');
});

test('validarPeriodoFechado: só meses fechados, até 24, na ordem', () => {
  const ultimo = '2026-10';
  assert.deepEqual(validarPeriodoFechado(null, null, ultimo), {});
  assert.deepEqual(validarPeriodoFechado('2026-05', '2026-10', ultimo), {});
  // Mês atual em `ate`.
  assert.deepEqual(validarPeriodoFechado('2026-05', '2026-11', ultimo), {
    ate: TEXTOS_ASSERTIVIDADE.soMesesFechados,
  });
  assert.deepEqual(validarPeriodoFechado(null, '2026-11', ultimo), {
    ate: TEXTOS_ASSERTIVIDADE.soMesesFechados,
  });
  assert.deepEqual(validarPeriodoFechado('2026-11', null, ultimo), {
    de: TEXTOS_ASSERTIVIDADE.soMesesFechados,
  });
  // 24 meses passa, 25 não.
  assert.deepEqual(validarPeriodoFechado('2024-11', '2026-10', ultimo), {});
  assert.deepEqual(validarPeriodoFechado('2024-10', '2026-10', ultimo), {
    ate: MENSAGENS_PERIODO.longo,
  });
  // Invertido.
  assert.deepEqual(validarPeriodoFechado('2026-09', '2026-05', ultimo), {
    de: MENSAGENS_PERIODO.invertido,
  });
  assert.deepEqual(validarPeriodoFechado('2026-13', null, ultimo), {
    de: MENSAGENS_PERIODO.formato,
  });
});

test('textoDeLeitura: normal, sem dados e previsto zero', () => {
  assert.equal(
    normal(textoDeLeitura(MES_NORMAL)),
    'Em outubro, na primeira semana, o forecast previa R$ 12.000,50; realizou R$ 11.000,00 (92%).',
  );
  assert.equal(
    normal(textoDeLeitura(MES_SEM_DADOS)),
    'Em setembro ainda não havia previsão guardada; realizou R$ 9.000,00.',
  );
  assert.equal(
    normal(textoDeLeitura(MES_PREVISTO_ZERO)),
    'Em agosto, na primeira semana, o forecast previa R$ 0,00; realizou R$ 500,00 (—).',
  );
});

test('todosSemDados: lista vazia não conta', () => {
  assert.equal(todosSemDados([]), false);
  assert.equal(todosSemDados(null), false);
  assert.equal(todosSemDados([MES_SEM_DADOS]), true);
  assert.equal(todosSemDados([MES_SEM_DADOS, { ...MES_SEM_DADOS, mes: '2026-08' }]), true);
  assert.equal(todosSemDados([MES_NORMAL, MES_SEM_DADOS]), false);
});

test('mesPadraoDaLeitura: o mais recente com snapshot', () => {
  assert.equal(mesPadraoDaLeitura([MES_NORMAL, MES_SEM_DADOS]), '2026-10');
  assert.equal(mesPadraoDaLeitura([MES_SEM_DADOS, MES_PREVISTO_ZERO]), '2026-08');
  assert.equal(mesPadraoDaLeitura([MES_SEM_DADOS]), null);
  assert.equal(mesPadraoDaLeitura([]), null);
});

test('erroDaAssertividade: 403 de papel oculta, 400 de período no filtro, o resto null', () => {
  assert.deepEqual(erroDaAssertividade(new ApiError('x', { status: 403, code: 'FORBIDDEN' })), {
    tipo: 'oculta',
  });
  const flag = new ApiError('x', {
    status: 403,
    code: 'FEATURE_NOT_ENABLED',
    details: { featureKey: 'crm.forecast' },
  });
  assert.equal(erroDaAssertividade(flag), null);

  const ate = new ApiError('x', {
    status: 400,
    code: 'VALIDATION_ERROR',
    fields: { ate: [TEXTOS_ASSERTIVIDADE.soMesesFechados] },
  });
  assert.deepEqual(erroDaAssertividade(ate), {
    tipo: 'filtro',
    campo: 'ate',
    mensagem: TEXTOS_ASSERTIVIDADE.soMesesFechados,
  });
  const de = new ApiError('x', { status: 400, fields: { de: [MENSAGENS_PERIODO.invertido] } });
  assert.deepEqual(erroDaAssertividade(de), {
    tipo: 'filtro',
    campo: 'de',
    mensagem: MENSAGENS_PERIODO.invertido,
  });

  assert.equal(
    erroDaAssertividade(new ApiError('x', { status: 400, fields: { mes: ['m'] } })),
    null,
  );
  assert.equal(erroDaAssertividade(new ApiError('x', { status: 500 })), null);
  assert.equal(erroDaAssertividade(null), null);
});

test('consulta na URL: ida e volta, guarda a aba, período novo fecha o mês', () => {
  const vazia = lerConsultaAssertividade(url('aba=assertividade'));
  assert.deepEqual(vazia, { de: null, ate: null, mes: null });
  assert.deepEqual(paramsDaAssertividade(vazia), {});

  const escrita = escreverConsultaAssertividade(url('aba=assertividade'), {
    de: '2026-05',
    ate: '2026-10',
    mes: '2026-09',
  });
  assert.equal(escrita.get('aba'), 'assertividade');
  const lida = lerConsultaAssertividade(escrita);
  assert.deepEqual(lida, { de: '2026-05', ate: '2026-10', mes: '2026-09' });
  assert.deepEqual(paramsDaAssertividade(lida), { de: '2026-05', ate: '2026-10' });
  assert.deepEqual(paramsDaAssertividade({ de: null, ate: '2026-10', mes: null }), {
    ate: '2026-10',
  });

  const outroAte = escreverConsultaAssertividade(escrita, { ate: '2026-08' });
  assert.equal(outroAte.get('mes'), null);
  assert.equal(outroAte.get('de'), '2026-05');
  assert.equal(outroAte.get('aba'), 'assertividade');

  const mesmoAte = escreverConsultaAssertividade(escrita, { ate: '2026-10' });
  assert.equal(mesmoAte.get('mes'), '2026-09');

  const soMes = escreverConsultaAssertividade(escrita, { mes: '2026-07' });
  assert.equal(soMes.get('mes'), '2026-07');
  assert.equal(soMes.get('ate'), '2026-10');

  const limpo = escreverConsultaAssertividade(escrita, { de: null });
  assert.equal(limpo.has('de'), false);
  assert.equal(limpo.has('mes'), false);

  assert.deepEqual(lerConsultaAssertividade(url('de=2026-13&ate=x&mes=2026-1')), {
    de: null,
    ate: null,
    mes: null,
  });
});

test('abas: Assertividade só para a gestão com a flag', () => {
  assert.deepEqual(
    abasVisiveis(DONO).map((aba) => aba.valor),
    [ABAS_FORECAST.PREVISAO, ABAS_FORECAST.ASSERTIVIDADE],
  );
  assert.deepEqual(
    abasVisiveis(OPERADOR).map((aba) => aba.valor),
    [ABAS_FORECAST.PREVISAO],
  );

  const naUrl = url('aba=assertividade');
  assert.equal(abaDaUrl(naUrl, DONO), ABAS_FORECAST.ASSERTIVIDADE);
  assert.equal(abaDaUrl(naUrl, MASTER), ABAS_FORECAST.ASSERTIVIDADE);
  assert.equal(abaDaUrl(naUrl, OPERADOR), ABAS_FORECAST.PREVISAO);
  assert.equal(abaDaUrl(naUrl, DONO_SEM_FLAG), ABAS_FORECAST.PREVISAO);
  assert.equal(abaDaUrl(url('aba=qualquer'), DONO), ABAS_FORECAST.PREVISAO);
  assert.equal(abaDaUrl(url(''), DONO), ABAS_FORECAST.PREVISAO);
  assert.equal(abaDaUrl(naUrl, null), ABAS_FORECAST.PREVISAO);
});

test('escreverAba: trocar limpa a outra consulta; a mesma aba fica igual', () => {
  const previsao = url(
    'de=2026-01&ate=2026-06&mes=2026-03&tipo=aberto&bloco=atrasadas&pipeline=p1',
  );
  const paraAssertividade = escreverAba(previsao, ABAS_FORECAST.ASSERTIVIDADE);
  assert.equal(paraAssertividade.toString(), 'aba=assertividade');

  const assertividade = url('aba=assertividade&de=2026-05&ate=2026-10&mes=2026-09');
  const paraPrevisao = escreverAba(assertividade, ABAS_FORECAST.PREVISAO);
  assert.equal(paraPrevisao.toString(), '');

  const mesma = escreverAba(assertividade, ABAS_FORECAST.ASSERTIVIDADE);
  assert.notEqual(mesma, assertividade);
  assert.equal(mesma.toString(), assertividade.toString());
  assert.equal(escreverAba(previsao, ABAS_FORECAST.PREVISAO).toString(), previsao.toString());
});
