/**
 * Views salvas são do usuário logado (o back filtra por `usuario_id`).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ id: string, nome: string, filtros: object }[]>}
 */
export function listarViews(authApi, options) {
  return authApi.get('/crm/filter-views', options);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ nome: string, filtros: object }} view `filtros` inclui `busca`
 */
export function salvarView(authApi, view) {
  return authApi.post('/crm/filter-views', view);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 */
export function excluirView(authApi, id) {
  return authApi.delete(`/crm/filter-views/${encodeURIComponent(id)}`);
}
