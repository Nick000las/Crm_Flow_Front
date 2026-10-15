/**
 * Campos ativos do tenant (Camadas 1, 2 visível e 3), já ordenados.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../types.js').Campo[]>}
 */
export function listarCampos(authApi, options) {
  return authApi.get('/crm/leads/fields', options);
}
