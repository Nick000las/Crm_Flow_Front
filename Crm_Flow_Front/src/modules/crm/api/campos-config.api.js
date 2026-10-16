/**
 * Campos personalizados (Camada 3): criar, editar e excluir — usados pelos
 * dialogs de Configurações › Campos. Matriz, nome do sistema e ordem vão por
 * `configuracoes.api.js`. Escrita só DONO/MASTER.
 */

/**
 * A `chave` é gerada pelo back a partir do rótulo; rótulo repetido (ou igual
 * ao de um campo do sistema) = 409 em `fields.label`.
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
 * Os dados já preenchidos ficam nos leads; o back devolve um `aviso` dizendo isso.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @returns {Promise<{ removido: true, aviso: string }>}
 */
export function excluirDefinicao(authApi, id) {
  return authApi.delete(`/crm/field-definitions/${encodeURIComponent(id)}`);
}
