/**
 * Duplicidade e mesclagem (`crm.duplicidade`). A checagem ao vivo não
 * depende da flag: sem ela, a lista vem vazia.
 *
 * @typedef {{ campo: string, label: string, acao: 'warn' | 'block', ativo: boolean }} RegraDuplicidade
 * @typedef {{ regras: RegraDuplicidade[], configurado: boolean }} ConfigDuplicidade
 * @typedef {{
 *   id: string,
 *   nome: string,
 *   campos: { campo: string, label: string }[],
 *   acao: 'warn' | 'block',
 * }} CandidatoDuplicado
 */

const REGRAS = '/crm/configuracoes/duplicidade';

/**
 * Qualquer papel lê.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ConfigDuplicidade>}
 */
export function obterRegras(authApi, options) {
  return authApi.get(REGRAS, options);
}

/**
 * Só DONO/MASTER. Parcial: campo não enviado fica como está.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {Partial<RegraDuplicidade>[]} regras
 * @returns {Promise<ConfigDuplicidade>}
 */
export function salvarRegras(authApi, regras) {
  return authApi.put(REGRAS, { regras });
}

/**
 * Checa sem salvar. Na edição, `leadId` tira o próprio lead da conta.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ email?: string, telefone?: string, cnpj?: string, cpf?: string, leadId?: string }} corpo
 * @returns {Promise<{ duplicados: CandidatoDuplicado[] }>}
 */
export function checarDuplicados(authApi, corpo) {
  return authApi.post('/crm/leads/duplicados', corpo);
}

/**
 * Só DONO/MASTER. O secundário vai para a lixeira (`mesclado_em_id`).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ principalId: string, secundarioId: string, escolhas?: Record<string, 'principal' | 'secundario'> }} corpo
 * @returns {Promise<import('../types.js').Lead>} o principal, formatado
 */
export function mesclarLeads(authApi, corpo) {
  return authApi.post('/crm/leads/merge', corpo);
}
