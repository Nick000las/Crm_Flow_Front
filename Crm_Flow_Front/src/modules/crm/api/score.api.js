/**
 * Pontuação de leads (`crm.score`). Leitura para qualquer papel (a tabela
 * pinta a faixa do score com as cores daqui); escrita só DONO/MASTER.
 *
 * @typedef {{ campoId: string, operador: string, valor?: unknown }} CondicaoScore
 * @typedef {{ id: string, nome: string, ativo: boolean, pontos: number, condicoes: CondicaoScore[] }} RegraScore  `condicoes` vazio = todos os leads
 * @typedef {{ chave: string, rotulo: string, minimo: number | null, maximo: number | null, cor: string }} FaixaScore  limites inclusivos; `null` = sem limite
 * @typedef {{ total: number, processados: number, emAndamento: boolean, concluidoEm: string | null }} RecalculoScore
 * @typedef {{
 *   regras: RegraScore[],
 *   faixas: FaixaScore[],
 *   faixasConfiguradas: boolean,
 *   recalculo: RecalculoScore | null,
 * }} ConfigScore  `faixas`: as padrão (Frio/Morno/Quente) enquanto `faixasConfiguradas` é falso
 */

const CONFIG = '/crm/configuracoes/score';

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ConfigScore>}
 */
export function obterScore(authApi, options) {
  return authApi.get(CONFIG, options);
}

/**
 * Regras (sem `id`: são substituídas) e faixas inteiras. Só responde depois
 * de recalcular todos os leads — o progresso sai no GET enquanto isso. 400
 * em `regras.<n>…`, `faixas.<n>…` e `faixas` (sobreposição, chave repetida).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ regras: Omit<RegraScore, 'id'>[], faixas: Array<Omit<FaixaScore, 'chave'> & { chave?: string }> }} config
 * @returns {Promise<ConfigScore>}
 */
export function salvarScore(authApi, config) {
  return authApi.put(CONFIG, config);
}

/**
 * Recalcula todos os leads sem mudar regra.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 */
export function recalcularScore(authApi) {
  return authApi.post(`${CONFIG}/recalcular`);
}
