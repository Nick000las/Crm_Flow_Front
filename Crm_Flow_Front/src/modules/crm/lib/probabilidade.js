import { CATEGORIAS_STATUS, TIPOS_CAMPO } from '../constants.js';
import { MENSAGENS, erroComercial, paraValorDeApi } from './form-lead.js';

/**
 * Probabilidade padrão por status (FC1). A oportunidade usa a própria
 * (`probabilidadeFechamento`) ou a do status; quem decide e calcula é o back,
 * que manda a que vale em `probabilidadeEfetiva`. Mudar o status apaga a
 * própria e a resposta avisa em `avisos`.
 *
 * @typedef {{ codigo: string, campo: string, anterior: number }} AvisoDaResposta
 */

export const CODIGO_PROBABILIDADE_REDEFINIDA = 'PROBABILIDADE_REDEFINIDA';

export const AJUDA_PROBABILIDADE_PADRAO =
  'Usada no forecast quando a oportunidade não tem probabilidade própria.';

/** Ganho e perdido não mudam: outro valor dá 400. */
const PROBABILIDADE_FIXA = Object.freeze({
  [CATEGORIAS_STATUS.GANHO]: 100,
  [CATEGORIAS_STATUS.PERDIDO]: 0,
});

/**
 * @param {string | null | undefined} categoria
 * @returns {number | null} `null` = editável (status aberto)
 */
export function probabilidadeFixa(categoria) {
  return PROBABILIDADE_FIXA[categoria] ?? null;
}

/** @param {number} valor */
export const comPorcento = (valor) => `${valor}%`;

/**
 * Texto do aviso de redefinição, ou `null` se a resposta não o traz. `atual`
 * é a efetiva depois da mudança; sem ela, a frase sai sem o número.
 *
 * @param {AvisoDaResposta[] | undefined} avisos
 * @param {number | null} [atual]
 * @returns {string | null}
 */
export function avisoDeProbabilidade(avisos, atual) {
  const aviso = (avisos ?? []).find((item) => item.codigo === CODIGO_PROBABILIDADE_REDEFINIDA);
  if (!aviso) {
    return null;
  }

  const padrao = typeof atual === 'number' ? ` (${comPorcento(atual)})` : '';
  return `A probabilidade voltou ao padrão do status${padrao}. Antes era ${comPorcento(aviso.anterior)}.`;
}

/**
 * Um aviso só na tela, com as frases que houver.
 *
 * @param {...(string | null | undefined)} textos
 * @returns {string | null}
 */
export function juntarAvisos(...textos) {
  const presentes = textos.filter(Boolean);
  return presentes.length > 0 ? presentes.join(' ') : null;
}

/**
 * A que vale na oportunidade; `null` quando o papel não vê o campo (a chave
 * nem vem).
 *
 * @param {{ probabilidadeFechamento?: number | null, probabilidadeEfetiva?: number | null }} oportunidade
 * @returns {{ valor: string, doStatus: boolean } | null}
 */
export function textoDaProbabilidade(oportunidade) {
  const efetiva = oportunidade.probabilidadeEfetiva;
  if (typeof efetiva !== 'number') {
    return null;
  }
  return {
    valor: comPorcento(efetiva),
    doStatus: typeof oportunidade.probabilidadeFechamento !== 'number',
  };
}

/**
 * Placeholder do campo vazio, que usa a do status.
 *
 * @param {number | null | undefined} padrao
 */
export function placeholderDoPadrao(padrao) {
  return typeof padrao === 'number'
    ? `Padrão do status (${comPorcento(padrao)})`
    : 'Padrão do status';
}

/**
 * Texto digitado → número, `null` (vazio) ou `NaN`.
 *
 * @param {string} texto
 */
export const lerProbabilidade = (texto) => paraValorDeApi(TIPOS_CAMPO.NUMERO, texto);

/**
 * Inteiro de 0 a 100, como o back. Vazio é válido: quem chama decide se vale.
 *
 * @param {string} texto
 * @returns {string | null}
 */
export function validarProbabilidade(texto) {
  const valor = lerProbabilidade(texto);
  if (Number.isNaN(valor)) {
    return MENSAGENS.PROBABILIDADE_INVALIDA;
  }
  return erroComercial('probabilidadeFechamento', valor);
}
