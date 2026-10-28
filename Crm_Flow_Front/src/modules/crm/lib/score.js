import { corValida } from '../../../lib/contraste.js';
import { SCORE } from '../constants.js';
import { condicaoParaEnvio, condicaoParaForm, validarCondicoes } from './condicoes.js';

/**
 * Pontuação de leads (`crm.score`): regras somam pontos quando o lead casa
 * com as condições; faixas (Frio/Morno/Quente…) dão nome e cor ao score. A
 * tela edita um rascunho e o PUT leva regras e faixas inteiras. Puro.
 *
 * @typedef {import('../api/score.api.js').ConfigScore} ConfigScore
 * @typedef {import('../api/score.api.js').FaixaScore} FaixaScore
 * @typedef {import('../api/score.api.js').RecalculoScore} RecalculoScore
 * @typedef {{
 *   chaveLocal: string,
 *   nome: string,
 *   ativo: boolean,
 *   pontos: string,
 *   condicoes: import('./condicoes.js').CondicaoNoForm[],
 * }} RegraScoreNoForm  `pontos` como digitado
 * @typedef {{
 *   chaveLocal: string,
 *   chave: string | null,
 *   rotulo: string,
 *   minimo: string,
 *   maximo: string,
 *   cor: string,
 * }} FaixaNoForm  `chave` da faixa salva (nula na nova); limites como digitados ('' = sem limite)
 * @typedef {{ regras: RegraScoreNoForm[], faixas: FaixaNoForm[] }} ValoresScore
 * @typedef {{
 *   regras: Record<string, Record<string, string>>,
 *   faixas: Record<string, Record<string, string>>,
 *   geral: string[],
 * }} ErrosScore  por `chaveLocal`; `geral` = da lista de faixas/regras
 */

export const MENSAGENS_SCORE = Object.freeze({
  NOME: 'Dê um nome à regra',
  PONTOS: `Pontos: um número inteiro entre -${SCORE.PONTOS_MAX} e ${SCORE.PONTOS_MAX}`,
  ROTULO: 'Dê um nome à faixa',
  LIMITE: 'Use um número inteiro (vazio = sem limite)',
  MINIMO_MAIOR: 'O mínimo passa do máximo',
  COR: 'Cor no formato #RRGGBB',
  SEM_FAIXA: 'Defina ao menos uma faixa',
  MAX_FAIXAS: `Use no máximo ${SCORE.MAX_FAIXAS} faixas`,
  MAX_REGRAS: `Use no máximo ${SCORE.MAX_REGRAS} regras`,
});

const COR_NOVA_FAIXA = '#6B7280';
const INTEIRO = /^-?\d+$/;

/** Texto → inteiro; '' → `null` (sem limite); inválido → `NaN`. */
function lerInteiro(texto) {
  const limpo = String(texto ?? '').trim();
  if (limpo === '') return null;
  return INTEIRO.test(limpo) ? Number(limpo) : Number.NaN;
}

const paraTexto = (numero) => (numero === null || numero === undefined ? '' : String(numero));

/**
 * A faixa de um score — espelho de `faixaDoScore` do back. O score chega
 * como string decimal (NUMERIC); limites inclusivos, `null` = sem limite.
 * `null` sem score ou fora de toda faixa.
 *
 * @param {FaixaScore[] | null | undefined} faixas
 * @param {unknown} score
 * @returns {FaixaScore | null}
 */
export function faixaDoScore(faixas, score) {
  if (!faixas || score === null || score === undefined || score === '') return null;
  const valor = Number(score);
  if (!Number.isFinite(valor)) return null;

  return (
    faixas.find(
      (faixa) => (faixa.minimo === null || valor >= faixa.minimo) && (faixa.maximo === null || valor <= faixa.maximo),
    ) ?? null
  );
}

/** "+20", "-10", "0" — os pontos de uma regra com sinal. */
export function textoDosPontos(pontos) {
  const numero = lerInteiro(pontos);
  if (numero === null || Number.isNaN(numero)) return String(pontos ?? '');
  return numero > 0 ? `+${numero}` : String(numero);
}

// ---------------------------------------------------------------------------
// Rascunho

/**
 * @param {ConfigScore} config
 * @param {import('../types.js').Campo[]} campos
 * @returns {ValoresScore}
 */
export function valoresDoScore(config, campos) {
  return {
    regras: config.regras.map((regra) => ({
      chaveLocal: regra.id,
      nome: regra.nome,
      ativo: regra.ativo,
      pontos: String(regra.pontos),
      condicoes: regra.condicoes.map((condicao) => condicaoParaForm(condicao, campos)),
    })),
    faixas: config.faixas.map((faixa) => ({
      chaveLocal: `faixa-${faixa.chave}`,
      chave: faixa.chave,
      rotulo: faixa.rotulo,
      minimo: paraTexto(faixa.minimo),
      maximo: paraTexto(faixa.maximo),
      cor: faixa.cor,
    })),
  };
}

/** @returns {RegraScoreNoForm} */
export function novaRegraScore(chaveLocal) {
  return { chaveLocal, nome: '', ativo: true, pontos: '10', condicoes: [] };
}

/** @returns {FaixaNoForm} */
export function novaFaixa(chaveLocal) {
  return { chaveLocal, chave: null, rotulo: '', minimo: '', maximo: '', cor: COR_NOVA_FAIXA };
}

/**
 * Erros de uma regra, pelo caminho do 400 do back sem `regras.<n>.`.
 *
 * @param {RegraScoreNoForm} regra
 * @param {import('../types.js').Campo[]} campos
 */
export function validarRegraScore(regra, campos) {
  const erros = {};
  if (!regra.nome.trim()) erros.nome = MENSAGENS_SCORE.NOME;
  const pontos = lerInteiro(regra.pontos);
  if (pontos === null || Number.isNaN(pontos) || Math.abs(pontos) > SCORE.PONTOS_MAX) erros.pontos = MENSAGENS_SCORE.PONTOS;

  return { ...erros, ...validarCondicoes(regra.condicoes, campos, SCORE.MAX_CONDICOES) };
}

/** @param {FaixaNoForm} faixa */
function validarFaixa(faixa) {
  const erros = {};
  if (!faixa.rotulo.trim()) erros.rotulo = MENSAGENS_SCORE.ROTULO;
  const minimo = lerInteiro(faixa.minimo);
  const maximo = lerInteiro(faixa.maximo);
  if (Number.isNaN(minimo)) erros.minimo = MENSAGENS_SCORE.LIMITE;
  if (Number.isNaN(maximo)) erros.maximo = MENSAGENS_SCORE.LIMITE;
  if (!erros.minimo && !erros.maximo && minimo !== null && maximo !== null && minimo > maximo) {
    erros.item = MENSAGENS_SCORE.MINIMO_MAIOR;
  }
  if (!corValida(faixa.cor)) erros.cor = MENSAGENS_SCORE.COR;
  return erros;
}

/** Sobreposição entre faixas válidas (o mesmo critério do back). */
function sobreposicao(faixas) {
  const ordenadas = faixas
    .map((faixa) => ({ rotulo: faixa.rotulo.trim(), minimo: lerInteiro(faixa.minimo), maximo: lerInteiro(faixa.maximo) }))
    .sort((a, b) => (a.minimo ?? -Infinity) - (b.minimo ?? -Infinity));

  for (let indice = 1; indice < ordenadas.length; indice++) {
    const anterior = ordenadas[indice - 1];
    const atual = ordenadas[indice];
    if ((anterior.maximo ?? Infinity) >= (atual.minimo ?? -Infinity)) {
      return `As faixas "${anterior.rotulo}" e "${atual.rotulo}" se sobrepõem`;
    }
  }
  return null;
}

/**
 * Corpo do PUT, ou os erros. Regras vão sem `id` (o back substitui todas);
 * a faixa salva mantém a `chave` — é ela que views e filtros guardam.
 *
 * @param {ValoresScore} valores
 * @param {import('../types.js').Campo[]} campos
 * @returns {{ corpo: { regras: object[], faixas: object[] } } | { erros: ErrosScore }}
 */
export function scoreParaEnvio(valores, campos) {
  /** @type {ErrosScore} */
  const erros = { regras: {}, faixas: {}, geral: [] };

  for (const regra of valores.regras) {
    const daRegra = validarRegraScore(regra, campos);
    if (Object.keys(daRegra).length > 0) erros.regras[regra.chaveLocal] = daRegra;
  }
  for (const faixa of valores.faixas) {
    const daFaixa = validarFaixa(faixa);
    if (Object.keys(daFaixa).length > 0) erros.faixas[faixa.chaveLocal] = daFaixa;
  }
  if (valores.regras.length > SCORE.MAX_REGRAS) erros.geral.push(MENSAGENS_SCORE.MAX_REGRAS);
  if (valores.faixas.length === 0) erros.geral.push(MENSAGENS_SCORE.SEM_FAIXA);
  if (valores.faixas.length > SCORE.MAX_FAIXAS) erros.geral.push(MENSAGENS_SCORE.MAX_FAIXAS);
  if (Object.keys(erros.faixas).length === 0) {
    const sobrepostas = sobreposicao(valores.faixas);
    if (sobrepostas) erros.geral.push(sobrepostas);
  }

  const temErro = erros.geral.length > 0 || Object.keys(erros.regras).length > 0 || Object.keys(erros.faixas).length > 0;
  if (temErro) return { erros };

  return {
    corpo: {
      regras: valores.regras.map((regra) => ({
        nome: regra.nome.trim(),
        ativo: regra.ativo,
        pontos: lerInteiro(regra.pontos),
        condicoes: regra.condicoes.map((condicao) => condicaoParaEnvio(condicao, campos)),
      })),
      faixas: valores.faixas.map((faixa) => ({
        ...(faixa.chave && { chave: faixa.chave }),
        rotulo: faixa.rotulo.trim(),
        minimo: lerInteiro(faixa.minimo),
        maximo: lerInteiro(faixa.maximo),
        cor: faixa.cor,
      })),
    },
  };
}

const semChaveLocal = (itens) =>
  itens.map((item) => {
    const resto = { ...item };
    delete resto.chaveLocal;
    return resto;
  });

/**
 * Algo mudou em relação ao salvo?
 *
 * @param {ValoresScore} valores
 * @param {ConfigScore} config
 * @param {import('../types.js').Campo[]} campos
 */
export function scoreMudou(valores, config, campos) {
  const salvo = valoresDoScore(config, campos);
  return (
    JSON.stringify([semChaveLocal(valores.regras), semChaveLocal(valores.faixas)]) !==
    JSON.stringify([semChaveLocal(salvo.regras), semChaveLocal(salvo.faixas)])
  );
}

/**
 * Chave que remonta o form quando a configuração salva muda — só regras e
 * faixas. O `recalculo` fica fora: o progresso recarrega a cada segundo e
 * não pode descartar o rascunho.
 *
 * @param {ConfigScore} config
 */
export function chaveDaConfig({ regras, faixas }) {
  return JSON.stringify({ regras, faixas });
}

const numeroFormatter = new Intl.NumberFormat('pt-BR');
const instanteFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

/**
 * "Recalculando… 1.500 de 3.000 leads" ou "Último recálculo: 27/10/2026, 14:02".
 *
 * @param {RecalculoScore | null | undefined} recalculo
 * @returns {string | null}
 */
export function textoDoRecalculo(recalculo) {
  if (!recalculo) return null;
  if (recalculo.emAndamento) {
    return `Recalculando… ${numeroFormatter.format(recalculo.processados)} de ${numeroFormatter.format(recalculo.total)} leads`;
  }
  if (!recalculo.concluidoEm) return null;
  const data = new Date(recalculo.concluidoEm);
  return Number.isNaN(data.getTime()) ? null : `Último recálculo: ${instanteFormatter.format(data)}`;
}

/**
 * O filtro que vai para a busca. Sem a flag, `faixaScore` sai (o back daria
 * 400): um link ou view antiga não quebra a lista.
 *
 * @param {import('./filtro.js').FiltroAplicado} filtro
 * @param {boolean} comScore
 */
export function filtroComScore(filtro, comScore) {
  if (comScore || !filtro.faixaScore) return filtro;

  return Object.fromEntries(Object.entries(filtro).filter(([chave]) => chave !== 'faixaScore'));
}
