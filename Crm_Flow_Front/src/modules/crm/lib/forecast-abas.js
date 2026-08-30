/**
 * @file Nova URL com a aba. Trocar de aba limpa a consulta da outra (de/ate/mes, lista,
 * pipeline…) e só guarda `aba`; a Previsão, que é o padrão, nem isso. A mesma aba devolve uma
 * cópia sem mudança.
 */
import { podeVer } from '../../../lib/acesso.js';
import { ABAS_FORECAST, CRM_FEATURES, PAPEIS_GESTAO } from '../constants.js';
import { TEXTOS_ASSERTIVIDADE } from './assertividade-textos.js';

/**
 * Abas da página Forecast. Visibilidade passa por `podeVer` (`src/lib/acesso.js`),
 * com `roles` e `feature` de cada entrada; nunca condição de papel no JSX.
 */
export const DEFINICOES_ABAS_FORECAST = Object.freeze([
  { valor: ABAS_FORECAST.PREVISAO, rotulo: TEXTOS_ASSERTIVIDADE.abaPrevisao },
  {
    valor: ABAS_FORECAST.ASSERTIVIDADE,
    rotulo: TEXTOS_ASSERTIVIDADE.aba,
    roles: PAPEIS_GESTAO,
    feature: CRM_FEATURES.FORECAST,
  },
]);

/** Param da URL que guarda a aba. Sem ele, vale a Previsão. */
const PARAM_ABA = 'aba';

/**
 * Abas que o usuário vê, na ordem das definições.
 * @param {Parameters<typeof podeVer>[1]} user
 */
export function abasVisiveis(user) {
  return DEFINICOES_ABAS_FORECAST.filter((def) => podeVer(def, user));
}

/**
 * Aba aberta, lida da URL. Aba desconhecida ou que o usuário não vê (OPERADOR,
 * flag desligada) cai na Previsão: é assim que a rota fica escondida.
 * @param {URLSearchParams} searchParams
 * @param {Parameters<typeof podeVer>[1]} user
 * @returns {string}
 */
export function abaDaUrl(searchParams, user) {
  const aba = searchParams.get(PARAM_ABA);

  return abasVisiveis(user).some((def) => def.valor === aba) ? aba : ABAS_FORECAST.PREVISAO;
}

/**
 * Nova URL com a aba. Trocar de aba limpa a consulta da outra (de/ate/mes,
 * lista, pipeline…) e só guarda `aba`; a Previsão, que é o padrão, nem isso.
 * A mesma aba devolve uma cópia sem mudança.
 * @param {URLSearchParams} searchParams
 * @param {string} aba
 * @returns {URLSearchParams}
 */
export function escreverAba(searchParams, aba) {
  const atual = searchParams.get(PARAM_ABA) || ABAS_FORECAST.PREVISAO;

  if (aba === atual) {
    return new URLSearchParams(searchParams);
  }

  const saida = new URLSearchParams();

  if (aba && aba !== ABAS_FORECAST.PREVISAO) {
    saida.set(PARAM_ABA, aba);
  }

  return saida;
}
