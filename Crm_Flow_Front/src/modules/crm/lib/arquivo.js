import { AVISOS_LEAD, SITUACOES_LEAD } from '../constants.js';

const SITUACOES = new Set(Object.values(SITUACOES_LEAD));
const MS_POR_DIA = 24 * 60 * 60 * 1000;

/**
 * Situação vinda da URL ou de uma view. Valor desconhecido vira "ativos":
 * o link pode ter sido editado à mão.
 *
 * @param {unknown} valor
 * @returns {'ativos' | 'arquivados' | 'lixeira'}
 */
export function lerSituacao(valor) {
  return SITUACOES.has(valor) ? valor : SITUACOES_LEAD.ATIVOS;
}

/**
 * A situação que vai para a busca. Sem `crm.arquivo` é sempre "ativos" (o
 * back daria 403): um link ou view antiga da lixeira não quebra a lista.
 *
 * @param {string} situacao
 * @param {boolean} comArquivo
 */
export function situacaoDaBusca(situacao, comArquivo) {
  return comArquivo ? lerSituacao(situacao) : SITUACOES_LEAD.ATIVOS;
}

/** @param {{ archived_at?: string | null } | null | undefined} lead */
export function estaArquivado(lead) {
  return Boolean(lead?.archived_at);
}

/**
 * Dias inteiros até a purga, arredondados para cima: faltando 2h ainda conta
 * 1 dia; 0 só quando o prazo já passou. `null` se a data não for válida.
 *
 * @param {string | null | undefined} purgaEm ISO
 * @param {Date} [agora]
 */
export function diasAtePurga(purgaEm, agora = new Date()) {
  const instante = purgaEm ? Date.parse(purgaEm) : Number.NaN;
  if (Number.isNaN(instante)) {
    return null;
  }

  return Math.max(0, Math.ceil((instante - agora.getTime()) / MS_POR_DIA));
}

/** "Exclui em 12 dias" — a coluna da lixeira. Vazio sem data. */
export function textoDaPurga(purgaEm, agora) {
  const dias = diasAtePurga(purgaEm, agora);
  if (dias === null) {
    return '';
  }
  if (dias === 0) {
    return 'Exclui hoje';
  }

  return `Exclui em ${dias} ${dias === 1 ? 'dia' : 'dias'}`;
}

/** Restaurar devolve o lead para onde estava: arquivado volta arquivado. */
export function avisoDaRestauracao(lead) {
  return estaArquivado(lead) ? AVISOS_LEAD.RESTAURADO_ARQUIVADO : AVISOS_LEAD.RESTAURADO;
}
