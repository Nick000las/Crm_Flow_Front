/**
 * @file `GET /crm/forecast/assertividade`. Sem `de`/`ate`, o back aplica o padrão (os 6 meses
 * fechados antes do atual, no fuso do tenant).
 */
import { comQuery } from './forecast.api';

/**
 * Tipos da assertividade do forecast (FC3), a partir de `handoff-front-fc3.md`, seção 2.
 * A rota `GET /crm/forecast/assertividade` fica atrás da flag `crm.forecast` e é
 * só da gestão (DONO e MASTER): OPERADOR recebe 403 `FORBIDDEN`.
 * `assertividade` é uma razão com 4 casas (0.9166 = 91,66%), não porcentagem.
 */

/**
 * Foto do forecast tirada na primeira segunda-feira do mês (ou depois dela).
 * @typedef {object} SnapshotForecast
 * @property {string} semana Segunda-feira `AAAA-MM-DD`, no fuso do tenant.
 * @property {string} tiradoEm Instante em UTC (ISO).
 */

/**
 * Linha de `porResponsavel`. Ordem: maior `previsto`, depois `rotulo`.
 * @typedef {object} ResponsavelAssertividade
 * @property {string | null} responsavelId `null` = oportunidades sem dono.
 * @property {string} rotulo Nome do usuário, "Sem responsável" ou "Responsável removido".
 * @property {number} previsto Dono com realizado fora do snapshot tem `0`.
 * @property {number} realizado
 * @property {number | null} assertividade `null` quando o previsto é 0.
 */

/**
 * Um mês de `meses`. Todo mês do período aparece, mesmo sem dado.
 * @typedef {object} MesAssertividade
 * @property {string} mes `AAAA-MM`.
 * @property {boolean} semDados `true` quando não há nenhum snapshot no mês.
 * @property {SnapshotForecast | null} snapshot
 * @property {number | null} previsto `realizadoNoSnapshot` + `ponderadoNoSnapshot`; `null` sem dados.
 * @property {number | null} realizadoNoSnapshot
 * @property {number | null} ponderadoNoSnapshot
 * @property {number} realizado Realizado de agora do mês; vem também com `semDados`.
 * @property {number | null} assertividade `realizado / previsto`, 4 casas; `null` com `semDados` ou previsto 0.
 * @property {ResponsavelAssertividade[]} porResponsavel `[]` quando `semDados`.
 */

/**
 * Resposta de `GET /crm/forecast/assertividade` (dentro de `data`). Os meses
 * vêm do mais recente para o mais antigo; quem desenha o gráfico inverte.
 * @typedef {object} RespostaAssertividade
 * @property {string} fuso Ex.: `America/Sao_Paulo`.
 * @property {{ de: string, ate: string }} periodo Período efetivo, com o padrão aplicado.
 * @property {MesAssertividade[]} meses
 */

/**
 * Query de `GET /crm/forecast/assertividade`. Todos opcionais; só meses fechados.
 * @typedef {object} ParamsAssertividade
 * @property {string} [de] `AAAA-MM`. Sem ele, vale `ate` menos 5. Máximo de 24 meses.
 * @property {string} [ate] `AAAA-MM`. Sem ele, vale o mês anterior ao atual.
 */

/**
 * `GET /crm/forecast/assertividade`. Sem `de`/`ate`, o back aplica o padrão
 * (os 6 meses fechados antes do atual, no fuso do tenant).
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {ParamsAssertividade} [params]
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<RespostaAssertividade>}
 */
export function buscarAssertividade(authApi, params, options) {
  return authApi.get(comQuery('/crm/forecast/assertividade', params), options);
}
