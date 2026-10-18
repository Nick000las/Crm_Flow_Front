/**
 * Lead esfriando (`crm.inatividade`): dias sem interação até o lead esfriar,
 * por status.
 */

const INATIVIDADE = '/crm/configuracoes/inatividade';

/**
 * Qualquer papel lê. Um item por status, na ordem da lista.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../lib/inatividade.js').StatusInatividade[]>}
 */
export function obterInatividade(authApi, options) {
  return authApi.get(INATIVIDADE, options);
}

/**
 * Só DONO/MASTER. Parcial: status não enviado fica como está; `null`
 * desliga. Status fechado com dias dá 400 em `fields["status.<key>"]`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {Record<string, number | null>} status
 * @returns {Promise<import('../lib/inatividade.js').StatusInatividade[]>} a lista atualizada
 */
export function salvarInatividade(authApi, status) {
  return authApi.put(INATIVIDADE, { status });
}
