/**
 * Atividades e histórico do lead (flag `crm.atividades`, qualquer papel).
 * Lead na lixeira dá 404.
 *
 * @typedef {{
 *   id: string,
 *   leadId: string,
 *   tipo: string,
 *   titulo: string,
 *   notas: string | null,
 *   agendadaPara: string | null,
 *   concluidaEm: string | null,
 *   autor: { id: string, nome: string } | null,
 *   criadoEm: string,
 *   atualizadoEm: string,
 * }} Atividade
 *
 * @typedef {{
 *   chave: string,
 *   label: string,
 *   tipo: string,
 *   antes: unknown,
 *   depois: unknown,
 *   opcoesLista?: import('../lib/opcoes.js').Opcao[],
 *   antesNome?: string | null,
 *   depoisNome?: string | null,
 * }} ItemDiff
 *
 * @typedef {{
 *   id: string,
 *   tipo: string,
 *   autor: { id: string, nome: string } | null,
 *   criadoEm: string,
 *   diff: ItemDiff[],
 * }} EventoLead
 */

const doLead = (id, ...partes) => ['/crm/leads', ...[id, ...partes].map(encodeURIComponent)].join('/');

/**
 * Abertas primeiro (a agendada mais próxima antes), depois as concluídas,
 * da mais recente para a mais antiga.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Atividade[]>}
 */
export function listarAtividades(authApi, leadId, options) {
  return authApi.get(doLead(leadId, 'atividades'), options);
}

/**
 * `concluida: true` registra algo que já aconteceu.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ tipo: string, titulo: string, notas?: string | null, agendadaPara?: string | null, concluida?: boolean }} corpo
 * @returns {Promise<Atividade>}
 */
export function criarAtividade(authApi, leadId, corpo) {
  return authApi.post(doLead(leadId, 'atividades'), corpo);
}

/**
 * Parcial: `concluida` true/false conclui ou reabre; `null` limpa.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {string} atividadeId
 * @param {Record<string, unknown>} parcial
 * @returns {Promise<Atividade>}
 */
export function editarAtividade(authApi, leadId, atividadeId, parcial) {
  return authApi.put(doLead(leadId, 'atividades', atividadeId), parcial);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {string} atividadeId
 */
export function excluirAtividade(authApi, leadId, atividadeId) {
  return authApi.delete(doLead(leadId, 'atividades', atividadeId));
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ pagina: number, tamanho: number }} paginacao
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ itens: EventoLead[], total: number, pagina: number, tamanho: number }>}
 */
export function listarHistorico(authApi, leadId, { pagina, tamanho }, options) {
  const query = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) });
  return authApi.get(`${doLead(leadId, 'historico')}?${query}`, options);
}
