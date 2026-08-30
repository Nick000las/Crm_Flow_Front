/**
 * @file Mensagens de erro dos filtros de ciclo de vida (espelham o 400 da busca).
 */
import { CICLOS_DE_VIDA } from '../constants.js';

/** Textos do ciclo de vida do lead (FC4). */

/** Rótulo de cada ciclo de vida. */
export const ROTULOS_CICLO = Object.freeze({
  [CICLOS_DE_VIDA.LEAD]: 'Lead',
  [CICLOS_DE_VIDA.OPORTUNIDADE]: 'Em negociação',
  [CICLOS_DE_VIDA.CLIENTE]: 'Cliente',
});

/** Ordem dos ciclos na multi-seleção e nas listas. */
export const ORDEM_CICLOS = Object.freeze([
  CICLOS_DE_VIDA.LEAD,
  CICLOS_DE_VIDA.OPORTUNIDADE,
  CICLOS_DE_VIDA.CLIENTE,
]);

/**
 * Chip de cliente. `mesAno` já vem formatado (mm/aaaa) por quem chama.
 *
 * @param {string} mesAno
 * @returns {string}
 */
export function textoClienteDesde(mesAno) {
  return `Cliente desde ${mesAno}`;
}

/** Cabeçalhos das colunas opcionais do ciclo de vida. */
export const ROTULOS_COLUNA_CICLO = Object.freeze({
  cicloDeVida: 'Ciclo de vida',
  clienteDesde: 'Cliente desde',
  ultimaCompra: 'Última compra',
  oportunidadesAbertas: 'Oportunidades abertas',
});

/** Legendas dos filtros de ciclo de vida e prefixo do chip. */
export const TEXTOS_FILTRO_CICLO = Object.freeze({
  cicloDeVida: 'Ciclo de vida',
  clienteDesde: 'Cliente desde',
  ultimaCompra: 'Última compra',
  oportunidadesAbertas: 'Oportunidades abertas',
  prefixoChip: 'Ciclo',
});

/** Mensagens de erro dos filtros de ciclo de vida (espelham o 400 da busca). */
export const MENSAGENS_CICLO = Object.freeze({
  DATA_INVERTIDA: 'A data inicial não pode ser depois da final',
  MIN_MAIOR: 'O mínimo não pode ser maior que o máximo',
  INTEIRO: 'Use um número inteiro a partir de 0',
});
