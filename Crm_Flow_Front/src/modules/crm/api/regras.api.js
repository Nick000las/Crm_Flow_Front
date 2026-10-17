/**
 * Regras de campo (`crm.regras`). Leitura para qualquer papel (o form
 * aplica as regras de todo mundo); escrita só DONO/MASTER. A regra do
 * sistema só aceita `{ ativo }` — o resto dá 409.
 */

const BASE = '/crm/configuracoes/regras';
const daRegra = (id) => `${BASE}/${encodeURIComponent(id)}`;

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../lib/regras.js').Regra[]>}
 */
export function listarRegras(authApi, options) {
  return authApi.get(BASE, options);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {Record<string, unknown>} corpo ver `payloadDaRegra`
 * @returns {Promise<import('../lib/regras.js').Regra>}
 */
export function criarRegra(authApi, corpo) {
  return authApi.post(BASE, corpo);
}

/**
 * Parcial; o `kind` não muda.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {Record<string, unknown>} parcial
 * @returns {Promise<import('../lib/regras.js').Regra>}
 */
export function editarRegra(authApi, id, parcial) {
  return authApi.put(daRegra(id), parcial);
}

/** @param {import('@/hooks/create-auth-session').AuthApi} authApi @param {string} id */
export function excluirRegra(authApi, id) {
  return authApi.delete(daRegra(id));
}
