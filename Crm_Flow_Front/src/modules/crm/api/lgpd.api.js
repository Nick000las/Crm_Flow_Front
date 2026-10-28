/**
 * LGPD (`crm.lgpd`): base legal padrão/obrigatória e anonimização.
 *
 * @typedef {{ key: string, label: string }} OpcaoLgpd
 * @typedef {{
 *   basePadrao: string | null,
 *   obrigatoria: boolean,
 *   basesLegais: OpcaoLgpd[],
 *   origensRegistro: OpcaoLgpd[],
 * }} ConfigLgpd  `obrigatoria` é o `obrigatorio` do campo Base legal
 * @typedef {{ leadId: string, leads: number, atividades: number, eventos: number }} ResultadoAnonimizacao
 */

const CONFIG = '/crm/configuracoes/lgpd';

/**
 * Qualquer papel lê (o form pré-seleciona a base padrão).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ConfigLgpd>}
 */
export function obterLgpd(authApi, options) {
  return authApi.get(CONFIG, options);
}

/**
 * Só DONO/MASTER. Salvar liga os quatro campos LGPD no detalhe, na tabela e
 * no filtro (e a Base legal no formulário).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ basePadrao: string | null, obrigatoria: boolean }} config
 * @returns {Promise<ConfigLgpd>}
 */
export function salvarLgpd(authApi, config) {
  return authApi.put(CONFIG, config);
}

/**
 * Pedido do titular, irreversível (só DONO/MASTER). Vale para lead
 * arquivado ou na lixeira e leva junto os mesclados nele. 409 = já
 * anonimizado; 403 = OPERADOR; 404 = não existe.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @returns {Promise<ResultadoAnonimizacao>}
 */
export function anonimizarLead(authApi, id) {
  return authApi.post(`/crm/leads/${encodeURIComponent(id)}/anonimizar`);
}
