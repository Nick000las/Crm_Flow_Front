/**
 * @file Linhas da tabela por responsável do mês. `semDados` não tem linhas.
 */
import { faixaDaAssertividade, porcentagem } from './assertividade.js';
import {
  ROTULOS_FAIXA,
  ROTULOS_SERIE_ASSERTIVIDADE,
  TEXTOS_ASSERTIVIDADE,
} from './assertividade-textos.js';
import { rotuloCurtoDoMes, rotuloDoMes } from './forecast-textos.js';
import { dinheiro } from './forecast-vista.js';
import { formatarData } from './formatadores.js';

/**
 * Vista da assertividade (FC3): só monta textos e pontos a partir do que a API
 * mandou. Nada é recalculado e `null` nunca vira 0, "0%" nem "R$ 0,00".
 */

/**
 * @typedef {import('../api/assertividade.api').MesAssertividade} MesAssertividade
 *
 * @typedef {object} PontoAssertividade
 * @property {string} mes
 * @property {string} rotulo
 * @property {string} rotuloLongo
 * @property {boolean} aberto
 * @property {boolean} semDados
 * @property {number | null} previsto
 * @property {number} realizado
 * @property {string | null} rotuloPct `null` com `semDados`; '—' sem razão.
 * @property {'otimista' | 'boa' | 'pessimista' | null} faixa
 * @property {string | null} rotuloFaixa
 * @property {{ rotulo: string, texto: string }[]} tooltip
 *
 * @typedef {object} LinhaResponsavel
 * @property {string} chave
 * @property {string} rotulo
 * @property {string} previsto
 * @property {string} realizado
 * @property {string} pct
 * @property {'otimista' | 'boa' | 'pessimista' | null} faixa
 * @property {string | null} rotuloFaixa
 */

const TRACO = '—';

/** Valor que o back garante como número; sem ele, traço. */
const din = (valor) => dinheiro(valor) ?? TRACO;

const rotuloDaFaixa = (faixa) => (faixa ? ROTULOS_FAIXA[faixa] : null);

/** @param {MesAssertividade} m */
function tooltipDoMes(m) {
  const S = ROTULOS_SERIE_ASSERTIVIDADE;

  if (m.semDados) {
    return [
      { rotulo: S.realizado, texto: din(m.realizado) },
      { rotulo: TEXTOS_ASSERTIVIDADE.semDados, texto: TRACO },
    ];
  }

  return [
    { rotulo: S.previsto, texto: din(m.previsto) },
    {
      rotulo: `${S.realizadoNoSnapshot} + ${S.ponderadoNoSnapshot}`,
      texto: `${din(m.realizadoNoSnapshot)} + ${din(m.ponderadoNoSnapshot)}`,
    },
    { rotulo: S.realizado, texto: din(m.realizado) },
    { rotulo: S.semana, texto: formatarData(m.snapshot?.semana) ?? TRACO },
    { rotulo: S.assertividade, texto: porcentagem(m.assertividade, 2) ?? TRACO },
  ];
}

/**
 * Pontos do gráfico, do mais antigo para o mais novo (a API manda o inverso).
 * @param {MesAssertividade[] | null | undefined} meses
 * @param {string | null | undefined} mesAberto
 * @returns {{ pontos: PontoAssertividade[] }}
 */
export function serieDaAssertividade(meses, mesAberto) {
  const pontos = [...(meses ?? [])].reverse().map((m) => {
    const faixa = faixaDaAssertividade(m.assertividade);
    let rotuloPct = null;

    if (!m.semDados) {
      rotuloPct = porcentagem(m.assertividade) ?? TRACO;
    }

    return {
      mes: m.mes,
      rotulo: rotuloCurtoDoMes(m.mes),
      rotuloLongo: rotuloDoMes(m.mes),
      aberto: m.mes === mesAberto,
      semDados: m.semDados,
      previsto: m.semDados ? null : m.previsto,
      realizado: m.realizado,
      rotuloPct,
      faixa,
      rotuloFaixa: rotuloDaFaixa(faixa),
      tooltip: tooltipDoMes(m),
    };
  });

  return { pontos };
}

/**
 * Linhas da tabela por responsável do mês. `semDados` não tem linhas.
 * @param {MesAssertividade | null | undefined} mes
 * @returns {LinhaResponsavel[]}
 */
export function linhasPorResponsavel(mes) {
  if (!mes || mes.semDados) {
    return [];
  }

  return (mes.porResponsavel ?? []).map((r) => {
    const faixa = faixaDaAssertividade(r.assertividade);

    return {
      chave: r.responsavelId ?? r.rotulo,
      rotulo: r.rotulo,
      previsto: din(r.previsto),
      realizado: din(r.realizado),
      pct: porcentagem(r.assertividade, 2) ?? TRACO,
      faixa,
      rotuloFaixa: rotuloDaFaixa(faixa),
    };
  });
}

/**
 * @param {MesAssertividade[] | null | undefined} meses
 * @param {string | null | undefined} mesAberto
 * @returns {MesAssertividade | null}
 */
export function mesDaTabela(meses, mesAberto) {
  if (!mesAberto) {
    return null;
  }

  return (meses ?? []).find((m) => m.mes === mesAberto) ?? null;
}
