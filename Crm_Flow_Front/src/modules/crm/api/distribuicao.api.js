/**
 * Distribuição automática (`crm.distribuicao`). Leitura para qualquer papel
 * (o form do lead precisa saber se está ligada); escrita só DONO/MASTER.
 *
 * @typedef {{ campoId: string, operador: string, valor?: unknown }} CondicaoDistribuicao
 * @typedef {{ tipo: 'usuario' | 'grupo', id: string }} DestinoDistribuicao
 * @typedef {{
 *   id: string,
 *   nome: string,
 *   ativo: boolean,
 *   condicoes: CondicaoDistribuicao[],
 *   destino: DestinoDistribuicao,
 * }} RegraDistribuicao  `condicoes` vazio = todos os leads
 * @typedef {{ id: string, nome: string, membros: string[] }} GrupoDistribuicao  `membros`: ids de usuário
 * @typedef {{
 *   ativo: boolean,
 *   fallback: 'rodizio_geral' | 'sem_responsavel',
 *   configurado: boolean,
 *   regras: RegraDistribuicao[],
 *   grupos: GrupoDistribuicao[],
 * }} ConfigDistribuicao  `regras` na ordem de avaliação
 */

const CONFIG = '/crm/configuracoes/distribuicao';
const GRUPOS = `${CONFIG}/grupos`;
const doGrupo = (id) => `${GRUPOS}/${encodeURIComponent(id)}`;

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ConfigDistribuicao>}
 */
export function obterDistribuicao(authApi, options) {
  return authApi.get(CONFIG, options);
}

/**
 * A configuração inteira: regra que não vem é apagada; a existente vai com
 * `id`. 400 em `fields` com caminho (`regras.0.destino`, `regras.1.condicoes.0`).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ ativo: boolean, fallback: string, regras: Array<Omit<RegraDistribuicao, 'id'> & { id?: string }> }} config
 * @returns {Promise<ConfigDistribuicao>}
 */
export function salvarDistribuicao(authApi, config) {
  return authApi.put(CONFIG, config);
}

/**
 * Nome repetido = 409 em `fields.nome`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ nome: string, membros: string[] }} grupo
 * @returns {Promise<GrupoDistribuicao>}
 */
export function criarGrupo(authApi, grupo) {
  return authApi.post(GRUPOS, grupo);
}

/**
 * Nome e a lista inteira de membros.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{ nome: string, membros: string[] }} grupo
 * @returns {Promise<GrupoDistribuicao>}
 */
export function editarGrupo(authApi, id, grupo) {
  return authApi.put(doGrupo(id), grupo);
}

/**
 * Grupo destino de alguma regra = 409 (a mensagem diz qual).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 */
export function excluirGrupo(authApi, id) {
  return authApi.delete(doGrupo(id));
}
