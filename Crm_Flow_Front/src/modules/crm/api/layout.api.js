/**
 * Layout do lead (flag `crm.layout`). Toda resposta é
 * `{ padrao, padraoConfigurado, meu, efetivo }`.
 *
 * @typedef {{
 *   padrao: import('../lib/layout.js').LayoutRefs,
 *   padraoConfigurado: boolean,
 *   meu: Partial<import('../lib/layout.js').LayoutRefs> | null,
 *   efetivo: import('../lib/layout.js').LayoutEfetivo,
 * }} RespostaLayout
 */

/**
 * Qualquer papel.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<RespostaLayout>}
 */
export function obterLayout(authApi, options) {
  return authApi.get('/crm/layout', options);
}

/**
 * Padrão da empresa, completo. Só DONO/MASTER (OPERADOR = 403 `FORBIDDEN`).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {import('../lib/layout.js').LayoutRefs} layout
 * @returns {Promise<RespostaLayout>}
 */
export function salvarPadrao(authApi, layout) {
  return authApi.put('/crm/layout/padrao', layout);
}

/**
 * O layout de quem está logado: só as partes enviadas sobrepõem o padrão.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {Partial<import('../lib/layout.js').LayoutRefs>} parcial
 * @returns {Promise<RespostaLayout>}
 */
export function salvarMeu(authApi, parcial) {
  return authApi.put('/crm/layout/meu', parcial);
}

/**
 * "Voltar ao padrão": apaga o override de quem está logado.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @returns {Promise<RespostaLayout>}
 */
export function removerMeu(authApi) {
  return authApi.delete('/crm/layout/meu');
}
