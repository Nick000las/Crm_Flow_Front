import { FUSO_PADRAO } from '../constants.js';
import { TIPO_COLUNA } from './colunas.js';
import { formatarDiaNoFuso, formatarMesAno, textoDoCiclo } from './ciclo-de-vida.js';

/**
 * Texto de uma célula das colunas do ciclo de vida (FC4), ou `null` quando não
 * há o que mostrar (a célula usa `<Vazio/>`). Nunca troca ausente por "Lead" nem
 * por 0; `0` em `oportunidades_abertas` é valor real. Tipo que não é do ciclo
 * também devolve `null`.
 *
 * @param {{ tipo: string }} coluna
 * @param {unknown} valor o que `lerValorDaColuna` devolveu
 * @param {string} [fuso]
 * @returns {string | null}
 */
export function textoDaCelulaCiclo(coluna, valor, fuso = FUSO_PADRAO) {
  switch (coluna.tipo) {
    case TIPO_COLUNA.CICLO:
      return textoDoCiclo(/** @type {any} */ (valor), fuso)?.texto ?? null;
    case TIPO_COLUNA.MES_ANO:
      return formatarMesAno(valor, fuso);
    case TIPO_COLUNA.DIA:
      return formatarDiaNoFuso(valor, fuso);
    case TIPO_COLUNA.INTEIRO:
      return typeof valor === 'number' && Number.isFinite(valor) ? String(valor) : null;
    default:
      return null;
  }
}
