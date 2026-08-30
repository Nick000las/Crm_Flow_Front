import { BUSCA_LEADS, SITUACOES_LEAD, TAMANHOS_PAGINA } from '../constants.js';
import { lerSituacao } from './arquivo.js';
import { FILTRO_VAZIO, lerFiltro, serializarFiltro } from './filtro.js';

const PRIMEIRA_PAGINA = 1;

/** Nome dos parâmetros na URL — curtos, porque o link é compartilhável. */
const PARAM = Object.freeze({
  BUSCA: 'q',
  PAGINA: 'pagina',
  TAMANHO: 'tamanho',
  FILTRO: 'f',
  SITUACAO: 'situacao',
});

/**
 * @typedef {Object} EstadoLista
 * @property {string} busca
 * @property {number} pagina
 * @property {number} tamanho
 * @property {import('./filtro.js').FiltroAplicado} filtro
 * @property {'ativos' | 'arquivados' | 'lixeira'} situacao  filtro fixo (`crm.arquivo`)
 */

/** @type {EstadoLista} */
export const ESTADO_LISTA_PADRAO = Object.freeze({
  busca: '',
  pagina: PRIMEIRA_PAGINA,
  tamanho: BUSCA_LEADS.TAMANHO_PADRAO,
  filtro: FILTRO_VAZIO,
  situacao: SITUACOES_LEAD.ATIVOS,
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
    situacao: lerSituacao(params.get(PARAM.SITUACAO)),
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
  definirOuRemover(proximos, PARAM.SITUACAO, estado.situacao, ESTADO_LISTA_PADRAO.situacao);

  return proximos;
}

function definirOuRemover(params, nome, valor, padrao) {
  if (valor === padrao) {
    params.delete(nome);
  } else {
    params.set(nome, String(valor));
  }
}

/**
 * O que uma view salva grava: filtro aplicado + `busca` + `situacao` (essas
 * duas só quando não são o padrão).
 *
 * @param {EstadoLista} estado
 */
export function visaoDoEstado({ filtro, busca, situacao }) {
  return {
    ...filtro,
    ...(busca && { busca }),
    ...(situacao !== SITUACOES_LEAD.ATIVOS && { situacao }),
  };
}

/**
 * View salva → mudanças no estado da lista (volta para a 1ª página).
 *
 * @param {Record<string, unknown> | null | undefined} filtros
 * @returns {Partial<EstadoLista>}
 */
export function estadoDaVisao(filtros) {
  return {
    busca: typeof filtros?.busca === 'string' ? filtros.busca : '',
    filtro: lerFiltro(filtros),
    situacao: lerSituacao(filtros?.situacao),
    pagina: PRIMEIRA_PAGINA,
  };
}

/** @param {number} total @param {number} tamanho */
export function totalDePaginas(total, tamanho) {
  return Math.max(PRIMEIRA_PAGINA, Math.ceil(total / tamanho));
}
