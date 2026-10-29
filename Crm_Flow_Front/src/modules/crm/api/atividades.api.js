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
 *   categorias?: string[],
 *   autor: { id: string, nome: string } | null,
 *   criadoEm: string,
 *   diff: ItemDiff[],
 *   detalhes?: {
 *     leadDescartadoId?: string,
 *     nomeDescartado?: string,
 *     cnpj?: string,
 *     distribuicao?: { origem: string, regraId?: string, regraNome?: string },
 *   } | null,
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
 * `categorias` (M16, flag `crm.timeline`): OU entre elas; vazio = todas.
 * Total e paginação já vêm filtrados.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ pagina: number, tamanho: number, categorias?: string[] }} paginacao
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ itens: EventoLead[], total: number, pagina: number, tamanho: number }>}
 */
export function listarHistorico(authApi, leadId, { pagina, tamanho, categorias = [] }, options) {
  const query = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) });
  if (categorias.length > 0) query.set('categorias', categorias.join(','));
  return authApi.get(`${doLead(leadId, 'historico')}?${query}`, options);
}

/**
 * Categorias do filtro do histórico (flag `crm.timeline`).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ key: string, label: string }[]>}
 */
export function listarCategoriasHistorico(authApi, options) {
  return authApi.get('/crm/historico/categorias', options);
}
