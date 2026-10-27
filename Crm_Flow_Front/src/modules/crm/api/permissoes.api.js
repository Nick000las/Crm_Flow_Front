/**
 * Permissão por campo (`crm.permissoes`). Só DONO/MASTER (o OPERADOR é o
 * papel configurável e vê o efeito em `/crm/leads/fields`).
 *
 * @typedef {{
 *   id: string,
 *   chave: string,
 *   label: string,
 *   camada: number,
 *   podeRestringir: boolean,
 *   acessos: Record<string, 'edit' | 'view' | 'hidden'>,
 * }} CampoPermissao  `podeRestringir: false` = sempre editável (o Nome)
 * @typedef {{ papeis: string[], campos: CampoPermissao[] }} ConfigPermissoes
 */

const BASE = '/crm/configuracoes/permissoes';

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ConfigPermissoes>}
 */
export function obterPermissoes(authApi, options) {
  return authApi.get(BASE, options);
}

/**
 * Por papel, o mapa inteiro `{ [campoId]: acesso }`. 400 em
 * `<papel>.<campoId>` (o Nome) ou `<papel>` (e-mail e telefone restritos).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {Record<string, Record<string, string>>} porPapel
 * @returns {Promise<ConfigPermissoes>}
 */
export function salvarPermissoes(authApi, porPapel) {
  return authApi.put(BASE, porPapel);
}
