/**
 * Enriquecimento por CNPJ (`crm.cnpj`).
 *
 * @typedef {{ campoReceita: string, chave: string, label: string, tipo: string, camada: number, valor: unknown }} SugestaoCnpj
 * @typedef {{
 *   cnpj: string,
 *   status: 'ok' | 'nao_encontrado' | 'nao_suportado',
 *   dados: Record<string, unknown> | null,
 *   sugestao: SugestaoCnpj[],
 * }} ConsultaCnpj  `valor` já no formato do campo de destino
 * @typedef {{
 *   ativo: boolean,
 *   modo: 'manual' | 'automatico',
 *   sobrescrever: boolean,
 *   mapeamento: Record<string, string>,
 *   configurado: boolean,
 *   camposReceita: { chave: string, label: string, tipos: string[] }[],
 * }} ConfigCnpj  `mapeamento`: dado da Receita → `id` do campo
 */

const CONFIG = '/crm/configuracoes/cnpj';

/**
 * Lupa (qualquer papel). Não grava no lead. Com ou sem máscara; a `/` vai
 * codificada. 503 `EXTERNAL_SERVICE_UNAVAILABLE` = tentar de novo (inclui o
 * 429 do provedor); 400 = DV; 403 `FORBIDDEN` = enriquecimento desligado
 * nas configurações depois que a tela carregou.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} cnpj
 * @returns {Promise<ConsultaCnpj>}
 */
export function consultarCnpj(authApi, cnpj) {
  return authApi.get(`/crm/cnpj/${encodeURIComponent(cnpj)}`);
}

/**
 * Qualquer papel lê (o form precisa saber se a lupa está ligada).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ConfigCnpj>}
 */
export function obterConfigCnpj(authApi, options) {
  return authApi.get(CONFIG, options);
}

/**
 * Só DONO/MASTER. A configuração inteira; 400 em `fields["mapeamento.<dado>"]`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ ativo: boolean, modo: string, sobrescrever: boolean, mapeamento: Record<string, string> }} config
 * @returns {Promise<ConfigCnpj>}
 */
export function salvarConfigCnpj(authApi, config) {
  return authApi.put(CONFIG, config);
}
