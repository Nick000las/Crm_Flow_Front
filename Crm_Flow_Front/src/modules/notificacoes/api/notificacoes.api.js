/**
 * Notificações do usuário logado (core, sem flag). O back só devolve e marca
 * as próprias — o usuário vem do token.
 */

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ pagina: number, tamanho: number }} paginacao
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../lib/notificacoes.js').PaginaNotificacoes>}
 */
export function listarNotificacoes(authApi, { pagina, tamanho }, options) {
  const params = new URLSearchParams({ pagina: String(pagina), tamanho: String(tamanho) });
  return authApi.get(`/notificacoes?${params}`, options);
}

/**
 * A de outro usuário (ou inexistente) é 404.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 */
export function marcarComoLida(authApi, id) {
  return authApi.post(`/notificacoes/${encodeURIComponent(id)}/lida`);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @returns {Promise<{ marcadas: number }>}
 */
export function marcarTodasComoLidas(authApi) {
  return authApi.post('/notificacoes/lidas');
}
