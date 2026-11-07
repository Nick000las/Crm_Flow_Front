/**
 * Oportunidades da pessoa (M2.5, sem flag). Campo desligado ou oculto para o
 * papel some da resposta, então toda chave comercial é opcional; sem `status`,
 * somem também `categoria`, `ganhaEm` e `perdidaEm`.
 *
 * @typedef {{
 *   id: string,
 *   leadId: string,
 *   pipelineId: string,
 *   origemId: string | null,
 *   titulo: string | null,
 *   status?: string,
 *   categoria?: 'aberto' | 'ganho' | 'perdido',
 *   valor?: number | null,
 *   probabilidadeFechamento?: number | null,
 *   dataPrevistaFechamento?: string | null,
 *   ganhaEm?: string | null,
 *   perdidaEm?: string | null,
 *   motivoPerda?: string | null,
 *   responsavelId: string | null,
 *   origemReabertaEm: string | null,
 *   arquivadaEm: string | null,
 *   criadaEm: string,
 *   atualizadaEm: string,
 * }} Oportunidade
 */

const doLead = (leadId) => `/crm/leads/${encodeURIComponent(leadId)}/oportunidades`;
const caminho = (id) => `/crm/oportunidades/${encodeURIComponent(id)}`;

/**
 * Mais nova primeiro; inclui arquivadas, sem a lixeira.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Oportunidade[]>}
 */
export function listarOportunidades(authApi, leadId, options) {
  return authApi.get(doLead(leadId), options);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<Oportunidade[]>}
 */
export function listarLixeira(authApi, leadId, options) {
  return authApi.get(`${doLead(leadId)}?situacao=lixeira`, options);
}

/**
 * Sem corpo; responde a oportunidade. Arquivada segue na lista, com
 * `arquivadaEm`, e sai do quadro.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {'arquivar' | 'desarquivar' | 'excluir' | 'restaurar'} acao
 * @returns {Promise<Oportunidade>}
 */
export function acaoDaOportunidade(authApi, id, acao) {
  return authApi.post(`${caminho(id)}/${acao}`);
}

/**
 * Tudo opcional: sem pipeline, o padrão; sem status, o primeiro aberto.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {Record<string, unknown>} corpo
 * @returns {Promise<Oportunidade>}
 */
export function criarOportunidade(authApi, leadId, corpo) {
  return authApi.post(doLead(leadId), corpo);
}

/**
 * Omitir mantém, `null` limpa. `expectedUpdatedAt` antigo = 409, com o estado
 * atual em `error.details.atual`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {Record<string, unknown> & { expectedUpdatedAt: string }} corpo
 * @returns {Promise<Oportunidade>}
 */
export function editarOportunidade(authApi, id, corpo) {
  return authApi.put(caminho(id), corpo);
}

/**
 * Ganhar, perder e reabrir. Aqui a última gravação vence: com versão antiga
 * grava do mesmo jeito e responde `conflito: true`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{ status: string, motivoPerda?: string | null, expectedUpdatedAt?: string }} corpo
 * @returns {Promise<Oportunidade & { conflito: boolean }>}
 */
export function mudarStatusDaOportunidade(authApi, id, corpo) {
  return authApi.patch(`${caminho(id)}/status`, corpo);
}
