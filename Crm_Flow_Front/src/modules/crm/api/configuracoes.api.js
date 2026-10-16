/**
 * Área Configurações › Campos (sem flag).
 * Leitura liberada a qualquer papel; escrita só DONO/MASTER (403 `FORBIDDEN`).
 */

const BASE = '/crm/configuracoes/campos';

/**
 * Todos os campos ativos, inclusive os ocultos em todas as telas, já ordenados.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../types.js').CampoConfigurado[]>}
 */
export function listarCamposConfigurados(authApi, options) {
  return authApi.get(BASE, options);
}

/**
 * `PUT` parcial (ao menos uma chave). `label: null` volta ao `labelPadrao`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{ label?: string | null, obrigatorio?: boolean, visibilidade?: Partial<import('../types.js').Visibilidade> }} parcial
 * @returns {Promise<import('../types.js').CampoConfigurado>}
 */
export function atualizarCampoConfigurado(authApi, id, parcial) {
  return authApi.put(`${BASE}/${encodeURIComponent(id)}`, parcial);
}

/**
 * Nova ordem com **todos** os ids da listagem, cada um uma vez (senão 400 em
 * `fields.ids`). Devolve a lista na ordem nova.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string[]} ids
 */
export function reordenarCamposConfigurados(authApi, ids) {
  return authApi.put(`${BASE}/ordem`, { ids });
}

/**
 * Sistema na ordem original; personalizados por data de criação.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 */
export function restaurarOrdemPadrao(authApi) {
  return authApi.post(`${BASE}/ordem/padrao`, {});
}
