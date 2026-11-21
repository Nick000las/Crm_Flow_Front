import { toApiError } from '../../../services/api-error.js';
import { FAIXAS_ASSERTIVIDADE, FUSO_PADRAO } from '../constants.js';
import { TEXTOS_ASSERTIVIDADE, rotuloMesSemAno } from './assertividade-textos.js';
import { validarPeriodo } from './forecast.js';
import { formatarMoeda } from './formatadores.js';

/**
 * Regras de exibição da assertividade do forecast (FC3). Previsto, realizado
 * e a razão vêm prontos do back: aqui nada é recalculado, e `null` nunca vira
 * 0 nem "0%".
 */

/**
 * @typedef {import('../api/assertividade.api').MesAssertividade} MesAssertividade
 * @typedef {import('../api/assertividade.api').ParamsAssertividade} ParamsAssertividade
 */

/**
 * Consulta da aba, na URL.
 * @typedef {object} ConsultaAssertividade
 * @property {string | null} de `AAAA-MM`.
 * @property {string | null} ate `AAAA-MM`.
 * @property {string | null} mes `AAAA-MM` do mês aberto na tabela por responsável.
 */

const PARTES_DA_CONSULTA = Object.freeze(['de', 'ate', 'mes']);

/** Campos de 400 da rota que a tela mostra como erro de filtro. */
const CAMPOS_DO_FILTRO = Object.freeze(['de', 'ate']);

const TRACO = '—';

/** @param {unknown} valor */
function ehMes(valor) {
  if (typeof valor !== 'string') {
    return false;
  }
  const m = /^\d{4}-(\d{2})$/.exec(valor);
  return Boolean(m) && Number(m[1]) >= 1 && Number(m[1]) <= 12;
}

/** @param {unknown} valor @returns {string | null} */
const mesOuNulo = (valor) => (ehMes(valor) ? /** @type {string} */ (valor) : null);

/**
 * @param {URLSearchParams} searchParams
 * @returns {ConsultaAssertividade}
 */
export function lerConsultaAssertividade(searchParams) {
  return {
    de: mesOuNulo(searchParams.get('de')),
    ate: mesOuNulo(searchParams.get('ate')),
    mes: mesOuNulo(searchParams.get('mes')),
  };
}

/**
 * Nova URL com as mudanças; o resto (como `aba`) fica. Mudar `de` ou `ate`
 * fecha o mês aberto, a menos que a mesma mudança traga um `mes`.
 * @param {URLSearchParams} searchParams
 * @param {Partial<ConsultaAssertividade>} mudancas
 * @returns {URLSearchParams}
 */
export function escreverConsultaAssertividade(searchParams, mudancas) {
  const atual = lerConsultaAssertividade(searchParams);
  const proxima = { ...atual, ...mudancas };

  const mudouPeriodo = ['de', 'ate'].some(
    (chave) => Object.hasOwn(mudancas, chave) && mesOuNulo(mudancas[chave]) !== atual[chave],
  );
  if (mudouPeriodo && !Object.hasOwn(mudancas, 'mes')) {
    proxima.mes = null;
  }

  const saida = new URLSearchParams(searchParams);
  for (const parte of PARTES_DA_CONSULTA) {
    saida.delete(parte);
    const valor = mesOuNulo(proxima[parte]);
    if (valor) {
      saida.set(parte, valor);
    }
  }
  return saida;
}

/**
 * Query da rota. Sem período na URL, o back aplica o padrão.
 * @param {ConsultaAssertividade} consulta
 * @returns {ParamsAssertividade}
 */
export function paramsDaAssertividade(consulta) {
  /** @type {ParamsAssertividade} */
  const params = {};
  if (consulta?.de) {
    params.de = consulta.de;
  }
  if (consulta?.ate) {
    params.ate = consulta.ate;
  }
  return params;
}

/** @param {string} fuso @param {Date} agora */
function anoEMes(fuso, agora) {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(agora);
  const ler = (tipo) => Number(partes.find((p) => p.type === tipo)?.value);
  return { ano: ler('year'), mes: ler('month') };
}

/**
 * Último mês fechado (o anterior ao atual) no fuso do tenant. Fuso vazio ou
 * inválido cai em `America/Sao_Paulo`.
 * @param {string | null | undefined} fuso
 * @param {Date} [agora]
 * @returns {string} `AAAA-MM`
 */
export function ultimoMesFechado(fuso, agora = new Date()) {
  let atual;
  try {
    atual = anoEMes(fuso || FUSO_PADRAO, agora);
  } catch {
    atual = anoEMes(FUSO_PADRAO, agora);
  }
  const ano = atual.mes === 1 ? atual.ano - 1 : atual.ano;
  const mes = atual.mes === 1 ? 12 : atual.mes - 1;
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

/**
 * As regras de `validarPeriodo` (formato, ordem, 24 meses) e só meses
 * fechados. Vazio não é erro: o back aplica o padrão.
 * @param {string | null | undefined} de
 * @param {string | null | undefined} ate
 * @param {string} ultimoFechado `AAAA-MM`, de `ultimoMesFechado`.
 * @returns {{ de?: string, ate?: string }}
 */
export function validarPeriodoFechado(de, ate, ultimoFechado) {
  const erros = { ...validarPeriodo(de, ate) };
  // `AAAA-MM` compara como texto.
  if (!erros.ate && ehMes(ate) && ate > ultimoFechado) {
    erros.ate = TEXTOS_ASSERTIVIDADE.soMesesFechados;
  }
  if (!erros.de && ehMes(de) && de > ultimoFechado) {
    erros.de = TEXTOS_ASSERTIVIDADE.soMesesFechados;
  }
  return erros;
}

/**
 * Razão da API em porcentagem (0.9166 → "92%", com 2 casas "91,66%"). Único
 * lugar que multiplica por 100. Sem razão (`null`), volta `null`: nunca "0%".
 * @param {number | null | undefined} razao
 * @param {number} [casas]
 * @returns {string | null}
 */
export function porcentagem(razao, casas = 0) {
  if (typeof razao !== 'number' || !Number.isFinite(razao)) {
    return null;
  }
  const formato = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
  return `${formato.format(razao * 100)}%`;
}

/**
 * Faixa da razão: abaixo de 80% otimista, acima de 120% pessimista, entre os
 * dois (inclusive) boa. Sem razão, `null`.
 * @param {number | null | undefined} razao
 * @returns {'otimista' | 'boa' | 'pessimista' | null}
 */
export function faixaDaAssertividade(razao) {
  if (typeof razao !== 'number' || !Number.isFinite(razao)) {
    return null;
  }
  if (razao < FAIXAS_ASSERTIVIDADE.OTIMISTA_ABAIXO) {
    return 'otimista';
  }
  if (razao > FAIXAS_ASSERTIVIDADE.PESSIMISTA_ACIMA) {
    return 'pessimista';
  }
  return 'boa';
}

/** Valor que o back garante como número; sem ele, traço (nunca "R$ 0,00"). */
const moeda = (valor) => formatarMoeda(valor) ?? TRACO;

/**
 * Texto "como ler" de um mês, com os números da API como vieram.
 * @param {MesAssertividade} mes
 * @returns {string}
 */
export function textoDeLeitura(mes) {
  const nome = rotuloMesSemAno(mes.mes);
  const realizou = `realizou ${moeda(mes.realizado)}`;
  if (mes.semDados) {
    return `Em ${nome} ainda não havia previsão guardada; ${realizou}.`;
  }
  const taxa = porcentagem(mes.assertividade) ?? TRACO;
  return `Em ${nome}, na primeira semana, o forecast previa ${moeda(mes.previsto)}; ${realizou} (${taxa}).`;
}

/**
 * Todos os meses sem snapshot (começo do uso). Lista vazia não conta.
 * @param {MesAssertividade[] | null | undefined} meses
 */
export function todosSemDados(meses) {
  return Array.isArray(meses) && meses.length > 0 && meses.every((mes) => mes.semDados);
}

/**
 * Mês aberto por padrão na leitura: o mais recente com snapshot (a API manda
 * do mais recente para o mais antigo).
 * @param {MesAssertividade[] | null | undefined} meses
 * @returns {string | null} `AAAA-MM`
 */
export function mesPadraoDaLeitura(meses) {
  return (meses ?? []).find((mes) => !mes.semDados)?.mes ?? null;
}

/**
 * Erro que a aba trata no lugar. 403 `FORBIDDEN` (papel) = esconder a aba;
 * 400 de `de`/`ate` = erro no filtro. O 403 `FEATURE_NOT_ENABLED` e o resto
 * voltam `null` (a página usa `isAccessError` e o erro de sempre).
 * @param {unknown} error
 * @returns {{ tipo: 'oculta' } | { tipo: 'filtro', campo: string, mensagem: string } | null}
 */
export function erroDaAssertividade(error) {
  if (!error) {
    return null;
  }
  const apiError = toApiError(error);
  if (apiError.status === 403 && apiError.code === 'FORBIDDEN') {
    return { tipo: 'oculta' };
  }
  if (apiError.status !== 400) {
    return null;
  }
  for (const campo of CAMPOS_DO_FILTRO) {
    const mensagem = apiError.fields[campo]?.[0];
    if (mensagem) {
      return { tipo: 'filtro', campo, mensagem };
    }
  }
  return null;
}
