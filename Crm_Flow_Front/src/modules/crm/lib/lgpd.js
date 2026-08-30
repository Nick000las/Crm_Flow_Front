/**
 * LGPD (`crm.lgpd`): textos e regras puras da anonimização e da base legal
 * do lote no import.
 */

const PALAVRA_DE_CONFIRMACAO = 'ANONIMIZAR';

/**
 * O que digitar para confirmar a anonimização: o nome do lead (ou a palavra
 * "ANONIMIZAR", se não tiver nome).
 *
 * @param {{ nome?: string | null } | null | undefined} lead
 */
export function textoDeConfirmacao(lead) {
  return lead?.nome?.trim() || PALAVRA_DE_CONFIRMACAO;
}

/** O digitado bate? Espaços nas pontas não contam; maiúsculas, sim. */
export function confirmacaoBate(digitado, esperado) {
  return String(digitado ?? '').trim() === esperado;
}

const plural = (quantidade, singular, plural_) =>
  `${quantidade} ${quantidade === 1 ? singular : plural_}`;

/**
 * "Lead anonimizado (2 leads, 3 atividades, 5 eventos)." — o resumo da resposta.
 *
 * @param {{ leads: number, atividades: number, eventos: number } | null | undefined} resultado
 */
export function resumoDaAnonimizacao(resultado) {
  if (!resultado) {
    return 'Lead anonimizado.';
  }
  const partes = [
    plural(resultado.leads, 'lead', 'leads'),
    plural(resultado.atividades, 'atividade', 'atividades'),
    plural(resultado.eventos, 'evento', 'eventos'),
  ];
  return `Lead anonimizado (${partes.join(', ')}).`;
}

/**
 * Import com base legal obrigatória e nenhuma coluna mapeada para ela: o
 * lote precisa de uma base (senão o back dá 400 em `mapeamento`).
 *
 * @param {{ obrigatoria: boolean } | null | undefined} config
 * @param {Record<string, string>} mapeamento coluna → chave do campo
 * @param {string} chaveBaseLegal
 */
export function exigeLote(config, mapeamento, chaveBaseLegal) {
  if (!config?.obrigatoria) {
    return false;
  }
  return !Object.values(mapeamento).includes(chaveBaseLegal);
}

export const MENSAGEM_LOTE = 'Escolha a base legal do lote (ou mapeie a coluna de base legal)';

/**
 * O problema do passo de mapeamento quando o lote é exigido e ficou vazio.
 *
 * @param {{ obrigatoria: boolean } | null | undefined} config
 * @param {Record<string, string>} mapeamento
 * @param {string} lote
 * @param {string} chaveBaseLegal
 * @returns {string | null}
 */
export function problemaDoLote(config, mapeamento, lote, chaveBaseLegal) {
  return exigeLote(config, mapeamento, chaveBaseLegal) && !lote ? MENSAGEM_LOTE : null;
}
