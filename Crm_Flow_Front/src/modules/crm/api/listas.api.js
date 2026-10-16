/**
 * Configurações › Listas (flag `crm.listas`). Leitura para qualquer papel;
 * escrita só DONO/MASTER. `tipo` ∈ `TIPOS_LISTA`.
 */

const BASE = '/crm/configuracoes/listas';
const caminho = (...partes) => [BASE, ...partes.map(encodeURIComponent)].join('/');

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../lib/listas.js').Listas>}
 */
export function listarListas(authApi, options) {
  return authApi.get(BASE, options);
}

/**
 * `category` obrigatória em status e proibida no resto; nome repetido = 409.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} tipo
 * @param {{ label: string, color?: string, category?: string }} corpo
 * @returns {Promise<import('../lib/listas.js').OpcaoConfigurada>}
 */
export function criarOpcao(authApi, tipo, corpo) {
  return authApi.post(caminho(tipo), corpo);
}

/**
 * `PUT` parcial; `color: null` limpa. Desativar o último status ganho/perdido = 409.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} tipo
 * @param {string} id
 * @param {{ label?: string, color?: string | null, category?: string, ativo?: boolean }} parcial
 * @returns {Promise<import('../lib/listas.js').OpcaoConfigurada>}
 */
export function atualizarOpcao(authApi, tipo, id, parcial) {
  return authApi.put(caminho(tipo, id), parcial);
}

/**
 * Todos os ids da lista, na ordem nova.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} tipo
 * @param {string[]} ids
 */
export function reordenarOpcoes(authApi, tipo, ids) {
  return authApi.put(caminho(tipo, 'ordem'), { ids });
}

/**
 * Opção em uso (ou a última de uma lista) = 409.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} tipo
 * @param {string} id
 */
export function excluirOpcao(authApi, tipo, id) {
  return authApi.delete(caminho(tipo, id));
}
