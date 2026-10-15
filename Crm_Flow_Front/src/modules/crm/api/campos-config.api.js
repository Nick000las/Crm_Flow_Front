/**
 * Configuração de campos (DONO/MASTER): visibilidade da Camada 2 e
 * definições da Camada 3. Leitura é liberada a todos; escrita, só gestão.
 */

/** @param {import('@/hooks/create-auth-session').AuthApi} authApi */
export function listarVisibilidade(authApi, options) {
  return authApi.get('/crm/field-visibility', options);
}

/**
 * `PUT` parcial: só as linhas enviadas mudam. Devolve as 15 atualizadas.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {import('../lib/campos-config').LinhaVisibilidade[]} linhas
 */
export function salvarVisibilidade(authApi, linhas) {
  return authApi.put('/crm/field-visibility', linhas);
}

/** @param {import('@/hooks/create-auth-session').AuthApi} authApi */
export function listarDefinicoes(authApi, options) {
  return authApi.get('/crm/field-definitions', options);
}

/**
 * A `chave` é gerada pelo back a partir do rótulo; rótulo repetido = 409.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ label: string, tipo: string, obrigatorio: boolean, opcoes?: string[], ordem: number }} definicao
 */
export function criarDefinicao(authApi, definicao) {
  return authApi.post('/crm/field-definitions', definicao);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{ label: string, tipo: string, obrigatorio: boolean, opcoes?: string[] }} definicao
 */
export function editarDefinicao(authApi, id, definicao) {
  return authApi.put(`/crm/field-definitions/${encodeURIComponent(id)}`, definicao);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ id: string, ordem: number }[]} ordens
 */
export function reordenarDefinicoes(authApi, ordens) {
  return authApi.put('/crm/field-definitions/reorder', ordens);
}

/**
 * Os dados já preenchidos ficam nos leads; o back devolve um `aviso` dizendo isso.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @returns {Promise<{ removido: true, aviso: string }>}
 */
export function excluirDefinicao(authApi, id) {
  return authApi.delete(`/crm/field-definitions/${encodeURIComponent(id)}`);
}
