/**
 * Configurações › Pipelines (M2.5, sem flag). Leitura para qualquer papel,
 * porque a aba Oportunidades precisa dos nomes e dos status; escrita só
 * DONO/MASTER. O `POST` de pipeline responde sem `status` nem `oportunidades`:
 * depois de escrever, recarregue a lista.
 *
 * @typedef {import('../lib/listas.js').OpcaoConfigurada} StatusDoPipeline
 *
 * @typedef {{
 *   ativa: boolean,
 *   origemId: string | null,
 *   statusInicial: string | null,
 *   regraDoDono: string,
 *   donoId: string | null,
 * }} Automacao
 *
 * @typedef {{
 *   id: string,
 *   nome: string,
 *   tipo: 'sales' | 'service',
 *   position: number,
 *   padrao: boolean,
 *   ativo: boolean,
 *   oportunidades: number,
 *   automacao: Automacao,
 *   status: StatusDoPipeline[],
 * }} Pipeline
 */

const BASE = '/crm/configuracoes/pipelines';
const caminho = (...partes) => [BASE, ...partes.map(encodeURIComponent)].join('/');

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Pipeline[]>}
 */
export function listarPipelines(authApi, options) {
  return authApi.get(BASE, options);
}

/**
 * O sexto dá 400 em `fields.pipeline`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ nome: string, tipo: string }} corpo
 */
export function criarPipeline(authApi, corpo) {
  return authApi.post(BASE, corpo);
}

/**
 * Parcial. Erros da automação em `fields['automacao.origemId']`,
 * `fields['automacao.statusInicial']` e `fields['automacao.donoId']`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{ nome?: string, ativo?: boolean, automacao?: Partial<Automacao> }} parcial
 */
export function atualizarPipeline(authApi, id, parcial) {
  return authApi.put(caminho(id), parcial);
}

/**
 * Padrão, com oportunidade ou origem de outro pipeline = 409.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 */
export function excluirPipeline(authApi, id) {
  return authApi.delete(caminho(id));
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} pipelineId
 * @param {{ label: string, color?: string, category: string }} corpo
 */
export function criarStatus(authApi, pipelineId, corpo) {
  return authApi.post(caminho(pipelineId, 'status'), corpo);
}

/**
 * Parcial. Mudar a categoria em uso ou desativar o último da categoria = 409.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} pipelineId
 * @param {string} id
 * @param {{ label?: string, color?: string | null, category?: string, ativo?: boolean }} parcial
 */
export function atualizarStatus(authApi, pipelineId, id, parcial) {
  return authApi.put(caminho(pipelineId, 'status', id), parcial);
}

/**
 * Todos os ids do pipeline, na ordem nova.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} pipelineId
 * @param {string[]} ids
 */
export function reordenarStatus(authApi, pipelineId, ids) {
  return authApi.put(caminho(pipelineId, 'status', 'ordem'), { ids });
}

/**
 * Em uso = 409.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} pipelineId
 * @param {string} id
 */
export function excluirStatus(authApi, pipelineId, id) {
  return authApi.delete(caminho(pipelineId, 'status', id));
}
