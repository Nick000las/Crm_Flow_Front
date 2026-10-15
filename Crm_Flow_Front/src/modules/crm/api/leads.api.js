/**
 * Busca paginada com filtro — a lista usa esta rota, e não `GET /crm/leads`,
 * porque filtro e paginação moram no mesmo endpoint.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {import('../types.js').Filtro & { paginacao: { pagina: number, tamanho: number } }} corpo
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../types.js').PaginaLeads>}
 */
export function pesquisarLeads(authApi, corpo, options) {
  return authApi.post('/crm/leads/search', corpo, options);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../types.js').Lead>}
 */
export function buscarLead(authApi, id, options) {
  return authApi.get(`/crm/leads/${encodeURIComponent(id)}`, options);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {Record<string, unknown>} payload ver `montarPayloadCriacao`
 * @returns {Promise<{ id: string }>}
 */
export function criarLead(authApi, payload) {
  return authApi.post('/crm/leads', payload);
}

/**
 * Edição parcial: campo omitido mantém, `null` limpa.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {Record<string, unknown>} payload ver `montarPayloadEdicao`
 * @returns {Promise<import('../types.js').Lead>}
 */
export function atualizarLead(authApi, id, payload) {
  return authApi.put(`/crm/leads/${encodeURIComponent(id)}`, payload);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 */
export function excluirLead(authApi, id) {
  return authApi.delete(`/crm/leads/${encodeURIComponent(id)}`);
}
