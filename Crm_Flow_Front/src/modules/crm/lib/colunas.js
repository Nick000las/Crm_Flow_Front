import { CAMADA } from '../constants.js';
import { ROTULOS_COLUNA_CICLO } from './ciclo-textos.js';

/** Tipos de coluna que não vêm de `/crm/leads/fields`. */
export const TIPO_COLUNA = Object.freeze({
  MOEDA: 'moeda',
  RESPONSAVEL: 'responsavel',
  /** Timestamp com fuso (`created_at`): data no fuso de quem vê. */
  INSTANTE: 'instante',
  /** Ciclo de vida (FC4): chip com o rótulo do ciclo. */
  CICLO: 'ciclo',
  /** Mês e ano (`cliente_desde`, instante ISO), no fuso do tenant. */
  MES_ANO: 'mes_ano',
  /** Dia (`ultima_compra`, instante ISO), no fuso do tenant. */
  DIA: 'dia',
  /** Inteiro sem formatação de campo (`oportunidades_abertas`). */
  INTEIRO: 'inteiro',
});

const COLUNA_RESPONSAVEL = Object.freeze({
  id: 'responsavel',
  label: 'Responsável',
  tipo: TIPO_COLUNA.RESPONSAVEL,
});

const COLUNA_CRIADO_EM = Object.freeze({
  id: 'criadoEm',
  label: 'Criado em',
  tipo: TIPO_COLUNA.INSTANTE,
});

/**
 * Colunas do ciclo de vida (FC4). Opcionais: fora de `COLUNAS_PADRAO`, o
 * seletor decide se entram. As de data só existem com `dataConversao`.
 */
const COLUNA_CICLO = Object.freeze({
  id: 'cicloDeVida',
  label: ROTULOS_COLUNA_CICLO.cicloDeVida,
  tipo: TIPO_COLUNA.CICLO,
});

const COLUNA_CLIENTE_DESDE = Object.freeze({
  id: 'clienteDesde',
  label: ROTULOS_COLUNA_CICLO.clienteDesde,
  tipo: TIPO_COLUNA.MES_ANO,
});

const COLUNA_ULTIMA_COMPRA = Object.freeze({
  id: 'ultimaCompra',
  label: ROTULOS_COLUNA_CICLO.ultimaCompra,
  tipo: TIPO_COLUNA.DIA,
});

const COLUNA_ABERTAS = Object.freeze({
  id: 'oportunidadesAbertas',
  label: ROTULOS_COLUNA_CICLO.oportunidadesAbertas,
  tipo: TIPO_COLUNA.INTEIRO,
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
  if (campo.camada === CAMADA.CAMADA_3) {
    return lead.custom_fields?.[campo.chave];
  }

  return lead[campo.coluna];
}

/**
 * Todas as colunas exibíveis: campos ativos do tenant, na ordem do back, mais
 * Responsável e Criado em, que não são campos de `/fields`, e as do ciclo de
 * vida (FC4): Ciclo, Cliente desde, Última compra e Abertas. Sem
 * `comDataConversao` (o papel não vê "Data de conversão"), as duas de data não
 * existem: `cliente_desde`/`ultima_compra` nem vêm no lead.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {{ comDataConversao?: boolean }} [opcoes] o gate é `comDataConversao(campos)`
 *   (`lib/ciclo-de-vida.js`) sobre **todos** os de `/fields`, não só os da tabela
 * @returns {Coluna[]}
 */
export function montarColunas(campos, { comDataConversao = true } = {}) {
  const colunasDeCampo = campos.map((campo) => ({
    id: campo.chave,
    label: campo.label,
    tipo: campo.tipo,
    campo,
  }));

  return [
    ...colunasDeCampo,
    COLUNA_RESPONSAVEL,
    COLUNA_CRIADO_EM,
    COLUNA_CICLO,
    ...(comDataConversao ? [COLUNA_CLIENTE_DESDE, COLUNA_ULTIMA_COMPRA] : []),
    COLUNA_ABERTAS,
  ];
}

/**
 * Valor que a célula recebe. Ciclo (`TIPO_COLUNA.CICLO`) devolve **o próprio
 * lead**: o chip precisa de `ciclo_de_vida` e de `cliente_desde` (use
 * `textoDoCiclo(valor, fuso)`). As demais do FC4 devolvem o valor cru, sem
 * trocar ausente/`null` por nada: `cliente_desde` e `ultima_compra` (instante
 * ISO, `null` ou `undefined` sem permissão) e `oportunidades_abertas` (inteiro;
 * `0` é valor real).
 *
 * @param {import('../types.js').Lead} lead
 * @param {Coluna} coluna
 */
export function lerValorDaColuna(lead, coluna) {
  if (coluna.tipo === TIPO_COLUNA.MOEDA) {
    return lead.valor;
  }
  if (coluna.tipo === TIPO_COLUNA.RESPONSAVEL) {
    return lead.usuario_responsavel_id;
  }
  if (coluna.tipo === TIPO_COLUNA.INSTANTE) {
    return lead.created_at;
  }
  if (coluna.tipo === TIPO_COLUNA.CICLO) {
    return lead;
  }
  if (coluna.tipo === TIPO_COLUNA.MES_ANO) {
    return lead.cliente_desde;
  }
  if (coluna.tipo === TIPO_COLUNA.DIA) {
    return lead.ultima_compra;
  }
  if (coluna.tipo === TIPO_COLUNA.INTEIRO) {
    return lead.oportunidades_abertas;
  }

  return lerValorDoCampo(lead, coluna.campo);
}

/**
 * Descarta ids de colunas que deixaram de existir (campo desligado ou
 * excluído). Sem nada válido — inclusive quando o usuário nunca escolheu —,
 * volta ao padrão: o do layout do tenant, se houver, senão `COLUNAS_PADRAO`.
 *
 * @param {unknown} ids
 * @param {Coluna[]} colunas
 * @param {readonly string[]} [padrao]
 * @returns {string[]}
 */
export function sanearSelecao(ids, colunas, padrao = COLUNAS_PADRAO) {
  const existentes = new Set(colunas.map((coluna) => coluna.id));
  const validos = Array.isArray(ids) ? ids.filter((id) => existentes.has(id)) : [];

  return validos.length > 0 ? validos : padrao.filter((id) => existentes.has(id));
}
