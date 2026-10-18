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

/**
 * Edição em massa (`crm.massa`). Sempre 200: o resultado de cada lead vem em
 * `resultados` (falha com o mesmo erro do PUT).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ ids: string[], alteracoes: import('../lib/massa.js').AlteracoesMassa }} corpo
 * @returns {Promise<import('../lib/massa.js').RespostaMassa>}
 */
export function editarEmMassa(authApi, corpo) {
  return authApi.patch('/crm/leads/bulk', corpo);
}

/**
 * Arquivar, desarquivar e restaurar da lixeira (`crm.arquivo`). Respondem
 * com o lead formatado; lead na lixeira (ou fora do prazo, ao restaurar) é 404.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {'arquivar' | 'desarquivar' | 'restaurar'} acao
 * @returns {Promise<import('../types.js').Lead>}
 */
export function acaoDeArquivo(authApi, id, acao) {
  return authApi.post(`/crm/leads/${encodeURIComponent(id)}/${acao}`);
}
