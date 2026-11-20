/**
 * Quadro comercial (M3): cada pipeline ativo é um quadro, cada status uma coluna
 * e cada oportunidade um card. Tudo é lido do CRM a cada consulta. Sem as flags
 * `crm.quadro_comercial` e `kanban_universal.quadros_entidade`, não existe.
 *
 * @typedef {{
 *   ref: string,
 *   nome: string,
 *   cor: string | null,
 *   categoria: 'aberto' | 'ganho' | 'perdido',
 *   ativa: boolean,
 * }} ColunaQuadro  `ativa: false` = status desativado que ainda tem cards
 * @typedef {{ ref: string, chave: string, label: string, tipo: string, valor: unknown }} ItemDoCard
 * @typedef {{
 *   entidadeId: string,
 *   atualizadoEm: string,
 *   rotaFicha: string,
 *   podeMover?: boolean,
 *   restrito?: true,
 *   leadId?: string,
 *   titulo?: string,
 *   subtitulo?: ItemDoCard[],
 *   destaques?: ItemDoCard[],
 *   selos?: (
 *     | { tipo: 'esfriando' | 'origem_reaberta', desde: string }
 *     | { tipo: 'alerta_formulario', nivel: 'info' | 'warning' | 'critical' }
 *   )[],
 *   tituloOportunidade?: string | null,
 *   responsavelId?: string | null,
 * }} CardQuadro  `restrito`: sem descrição, só os três primeiros campos. `podeMover`
 *   já cobre a permissão do Status, pessoa anonimizada e oportunidade arquivada
 * @typedef {{ itens: CardQuadro[], proximoCursor: string | null }} PaginaDeCards  o cursor é
 *   opaco e vale só para a consulta em que nasceu
 * @typedef {{ total: number, soma: number | null }} ResumoDaColuna  `soma: null` = não vê Valor
 * @typedef {{
 *   itens: (CardQuadro & { colunaRef: string })[],
 *   ausentes: string[],
 * }} ReleituraDeCards  `ausentes`: saiu do quadro, do filtro ou do alcance do usuário
 * @typedef {{
 *   entidadeId: string,
 *   colunaRef: string,
 *   conflito: boolean,
 *   avisos: import('../lib/probabilidade.js').AvisoDaResposta[],
 *   atualizadoEm: string,
 *   saiuDoFiltro: boolean,
 * }} ResultadoDoMover
 */

export const BOARD_TYPE = 'crm_oportunidades';

const doQuadro = (quadroRef, resto) =>
  `/kanban/quadros/${BOARD_TYPE}/${encodeURIComponent(quadroRef)}/${resto}`;

/**
 * Na ordem do pipeline.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} quadroRef id do pipeline
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ColunaQuadro[]>}
 */
export function listarColunas(authApi, quadroRef, options) {
  return authApi.get(doQuadro(quadroRef, 'colunas'), options);
}

/**
 * Uma página de uma coluna. Sem `ordem`, da atualização mais recente para a
 * mais antiga. `filtros` e `ordem` são os de `montarConsulta`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} quadroRef
 * @param {{
 *   colunaRef: string,
 *   limite: number,
 *   cursor?: string,
 * } & import('../lib/quadro-consulta.js').ConsultaDoQuadro} corpo
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<PaginaDeCards>}
 */
export function buscarCards(authApi, quadroRef, corpo, options) {
  return authApi.post(doQuadro(quadroRef, 'cards/busca'), corpo, options);
}

/**
 * Com os mesmos `filtros` da busca, senão total e soma não batem com a tela.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} quadroRef
 * @param {{ colunaRef: string, filtros?: Record<string, unknown> }} corpo
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ResumoDaColuna>}
 */
export function resumirColuna(authApi, quadroRef, corpo, options) {
  return authApi.post(doQuadro(quadroRef, 'resumo'), corpo, options);
}

/**
 * Relê os cards de um aviso de tempo real, com os mesmos `filtros` da tela. Não
 * aceita `ordem`. No máximo `LIMITE_DE_IDS` por chamada.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} quadroRef
 * @param {{ ids: string[], filtros?: Record<string, unknown> }} corpo
 * @returns {Promise<ReleituraDeCards>}
 */
export function relerCards(authApi, quadroRef, corpo) {
  return authApi.post(doQuadro(quadroRef, 'cards/por-ids'), corpo);
}

/**
 * Com `dados.leadId`, oportunidade para a pessoa; sem ele, pessoa nova, que
 * nasce só neste pipeline e aceita `ignorarDuplicados`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} quadroRef
 * @param {{ colunaRef: string, dados: Record<string, unknown> }} corpo
 * @returns {Promise<{ entidadeId: string, colunaRef: string, leadId?: string }>}
 */
export function criarCard(authApi, quadroRef, corpo) {
  return authApi.post(doQuadro(quadroRef, 'cards'), corpo);
}

/**
 * Mover é mudar o status. `CAMPOS_OBRIGATORIOS` (400) traz o que falta em
 * `fields`; `conflito: true` = gravou, mas outra pessoa mexeu antes. Com `filtros`
 * (o da tela), `saiuDoFiltro` diz se o card ainda atende a ele. `campos` é o
 * que grava junto com o status: `motivoPerda` e `probabilidadeFechamento`.
 * Mudar o status apaga a probabilidade própria (FC1), com o aviso
 * `PROBABILIDADE_REDEFINIDA` em `avisos` (sempre uma lista), a menos que ela
 * venha em `campos`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} quadroRef
 * @param {string} entidadeId
 * @param {{
 *   colunaDestino: string,
 *   expectedUpdatedAt?: string,
 *   filtros?: Record<string, unknown>,
 *   campos?: { motivoPerda?: string | null, probabilidadeFechamento?: number | null },
 * }} corpo
 * @returns {Promise<ResultadoDoMover>}
 */
export function moverCard(authApi, quadroRef, entidadeId, corpo) {
  return authApi.patch(doQuadro(quadroRef, `cards/${encodeURIComponent(entidadeId)}/mover`), corpo);
}
