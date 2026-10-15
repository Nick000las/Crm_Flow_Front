import { CAMADA } from '../constants.js';

/** Tipos de coluna que não vêm de `/crm/leads/fields`. */
export const TIPO_COLUNA = Object.freeze({
  MOEDA: 'moeda',
  RESPONSAVEL: 'responsavel',
});

const COLUNA_VALOR = Object.freeze({ id: 'valor', label: 'Valor', tipo: TIPO_COLUNA.MOEDA });
const COLUNA_RESPONSAVEL = Object.freeze({
  id: 'responsavel',
  label: 'Responsável',
  tipo: TIPO_COLUNA.RESPONSAVEL,
});

export const COLUNAS_PADRAO = Object.freeze(['nome', 'email', 'telefone', 'status', 'responsavel']);

/**
 * @typedef {Object} Coluna
 * @property {string} id
 * @property {string} label
 * @property {string} tipo   `TipoCampo` ou um `TIPO_COLUNA`
 * @property {import('../types.js').Campo} [campo]
 */

/**
 * Valor de um campo em um lead lido. Camadas 1/2 vêm na propriedade
 * `coluna` (snake_case, mandada por `/fields`); a Camada 3, em
 * `custom_fields[chave]`.
 *
 * @param {import('../types.js').Lead} lead
 * @param {import('../types.js').Campo} campo
 */
export function lerValorDoCampo(lead, campo) {
  if (campo.camada === CAMADA.CAMADA_3) return lead.custom_fields?.[campo.chave];

  return lead[campo.coluna];
}

/**
 * Todas as colunas exibíveis: campos ativos do tenant, na ordem do back, mais
 * Valor e Responsável, que não são campos de `/fields`.
 *
 * @param {import('../types.js').Campo[]} campos
 * @returns {Coluna[]}
 */
export function montarColunas(campos) {
  const colunasDeCampo = campos.map((campo) => ({
    id: campo.chave,
    label: campo.label,
    tipo: campo.tipo,
    campo,
  }));

  return [...colunasDeCampo, COLUNA_VALOR, COLUNA_RESPONSAVEL];
}

/**
 * @param {import('../types.js').Lead} lead
 * @param {Coluna} coluna
 */
export function lerValorDaColuna(lead, coluna) {
  if (coluna.tipo === TIPO_COLUNA.MOEDA) return lead.valor;
  if (coluna.tipo === TIPO_COLUNA.RESPONSAVEL) return lead.usuario_responsavel_id;

  return lerValorDoCampo(lead, coluna.campo);
}

/**
 * Descarta ids de colunas que deixaram de existir (campo desligado ou
 * excluído). Sem nada válido, volta ao padrão.
 *
 * @param {unknown} ids
 * @param {Coluna[]} colunas
 * @returns {string[]}
 */
export function sanearSelecao(ids, colunas) {
  const existentes = new Set(colunas.map((coluna) => coluna.id));
  const validos = Array.isArray(ids) ? ids.filter((id) => existentes.has(id)) : [];

  return validos.length > 0 ? validos : COLUNAS_PADRAO.filter((id) => existentes.has(id));
}
