/**
 * Usuários ativos do tenant, para o select e o nome do responsável.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ id: string, nome: string }[]>}
 */
export function listarUsuarios(authApi, options) {
  return authApi.get('/crm/usuarios', options);
}
