import { BUSCA_LEADS, TAMANHOS_PAGINA } from '../constants.js';
import { FILTRO_VAZIO, lerFiltro, serializarFiltro } from './filtro.js';

const PRIMEIRA_PAGINA = 1;

/** Nome dos parâmetros na URL — curtos, porque o link é compartilhável. */
const PARAM = Object.freeze({ BUSCA: 'q', PAGINA: 'pagina', TAMANHO: 'tamanho', FILTRO: 'f' });

/**
 * @typedef {Object} EstadoLista
 * @property {string} busca
 * @property {number} pagina
 * @property {number} tamanho
 * @property {import('./filtro.js').FiltroAplicado} filtro
 */

/** @type {EstadoLista} */
export const ESTADO_LISTA_PADRAO = Object.freeze({
  busca: '',
  pagina: PRIMEIRA_PAGINA,
  tamanho: BUSCA_LEADS.TAMANHO_PADRAO,
  filtro: FILTRO_VAZIO,
});

function lerInteiro(texto, fallback) {
  const numero = Number(texto);

  return Number.isInteger(numero) ? numero : fallback;
}

/**
 * Lê o estado da lista da URL. Valor inválido cai no padrão em vez de virar
 * um 400 do back: o link pode ter sido editado à mão.
 *
 * @param {URLSearchParams} params
 * @returns {EstadoLista}
 */
export function lerEstadoLista(params) {
  const pagina = lerInteiro(params.get(PARAM.PAGINA), PRIMEIRA_PAGINA);
  const tamanho = lerInteiro(params.get(PARAM.TAMANHO), ESTADO_LISTA_PADRAO.tamanho);

  return {
    busca: params.get(PARAM.BUSCA)?.trim() ?? '',
    pagina: pagina >= PRIMEIRA_PAGINA ? pagina : PRIMEIRA_PAGINA,
    tamanho: TAMANHOS_PAGINA.includes(tamanho) ? tamanho : ESTADO_LISTA_PADRAO.tamanho,
    filtro: params.has(PARAM.FILTRO) ? lerFiltro(params.get(PARAM.FILTRO)) : FILTRO_VAZIO,
  };
}

/**
 * Escreve o estado na URL omitindo o que é padrão, para o link ficar limpo.
 * Preserva parâmetros que não são da lista.
 *
 * @param {URLSearchParams} atuais
 * @param {Partial<EstadoLista>} mudancas
 */
export function escreverEstadoLista(atuais, mudancas) {
  const estado = { ...lerEstadoLista(atuais), ...mudancas };
  const proximos = new URLSearchParams(atuais);

  definirOuRemover(proximos, PARAM.BUSCA, estado.busca.trim(), ESTADO_LISTA_PADRAO.busca);
  definirOuRemover(proximos, PARAM.PAGINA, estado.pagina, ESTADO_LISTA_PADRAO.pagina);
  definirOuRemover(proximos, PARAM.TAMANHO, estado.tamanho, ESTADO_LISTA_PADRAO.tamanho);
  definirOuRemover(proximos, PARAM.FILTRO, serializarFiltro(estado.filtro), null);

  return proximos;
}

function definirOuRemover(params, nome, valor, padrao) {
  if (valor === padrao) params.delete(nome);
  else params.set(nome, String(valor));
}

/** @param {number} total @param {number} tamanho */
export function totalDePaginas(total, tamanho) {
  return Math.max(PRIMEIRA_PAGINA, Math.ceil(total / tamanho));
}
