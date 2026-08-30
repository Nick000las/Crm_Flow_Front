import {
  ACOES_DUPLICIDADE,
  CAMADA,
  CAMPOS_DUPLICIDADE,
  CODIGOS_DUPLICIDADE,
  ESTRATEGIAS_DUPLICATA,
  ROTULOS_ESTRATEGIA,
} from '../constants.js';
import { idNoForm, paraValorDeApi } from './form-lead.js';

/**
 * Regras de duplicidade no front (`crm.duplicidade`). O back decide o que é
 * duplicado (normaliza telefone, documento e e-mail); aqui só se lê o que
 * ele devolve e se monta o que vai para ele.
 *
 * @typedef {import('../api/duplicidade.api.js').CandidatoDuplicado} CandidatoDuplicado
 * @typedef {import('../api/duplicidade.api.js').RegraDuplicidade} RegraDuplicidade
 * @typedef {{ linha: number, acao: 'warn' | 'block', leads: CandidatoDuplicado[] }} DuplicadoDoImport
 */

const CODIGOS = new Set(Object.values(CODIGOS_DUPLICIDADE));
const DE_CAMPO = new Set(CAMPOS_DUPLICIDADE);

/** 409 de duplicidade ao salvar o lead. @param {{ code?: string } | null | undefined} erro */
export function ehErroDeDuplicidade(erro) {
  return CODIGOS.has(erro?.code);
}

/** Bloqueio: não há "Salvar mesmo assim". */
export function ehBloqueio(erro) {
  return erro?.code === CODIGOS_DUPLICIDADE.BLOQUEIO;
}

/**
 * Os parecidos que vieram no 409 (`details.duplicados`). Forma inesperada
 * vira lista vazia — o diálogo ainda explica o erro.
 *
 * @param {{ details?: unknown } | null | undefined} erro
 * @returns {CandidatoDuplicado[]}
 */
export function candidatosDoErro(erro) {
  const lista = erro?.details?.duplicados;
  return Array.isArray(lista) ? lista.filter((item) => typeof item?.id === 'string') : [];
}

/** "E-mail e telefone iguais" — por que o lead parece duplicado. */
export function descreverCandidato(candidato) {
  const labels = (candidato.campos ?? []).map((campo) => campo.label);
  if (labels.length === 0) {
    return 'Parecido';
  }

  const juntos =
    labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} e ${labels.at(-1)}`;
  return `${juntos} ${labels.length === 1 ? 'igual' : 'iguais'}`;
}

/**
 * Corpo de `POST /crm/leads/duplicados` a partir do form: só os campos que
 * as regras checam, preenchidos. `null` = nada a checar (sem chamada).
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {Record<string, unknown>} valores
 * @param {string} [leadId] na edição, tira o próprio lead da conta
 */
export function consultaDeDuplicados(campos, valores, leadId) {
  const corpo = {};

  for (const campo of campos) {
    if (campo.camada === CAMADA.CAMADA_3 || !DE_CAMPO.has(campo.chave)) {
      continue;
    }
    const valor = paraValorDeApi(campo.tipo, valores[idNoForm(campo)]);
    if (typeof valor === 'string') {
      corpo[campo.chave] = valor;
    }
  }

  if (Object.keys(corpo).length === 0) {
    return null;
  }
  return leadId ? { ...corpo, leadId } : corpo;
}

/** Campo do form que dispara a checagem ao sair dele. */
export function checaDuplicidade(campo) {
  return campo.camada !== CAMADA.CAMADA_3 && DE_CAMPO.has(campo.chave);
}

// ---------------------------------------------------------------------------
// Configurações › Duplicidade

/** @param {RegraDuplicidade[]} regras @returns {Record<string, { ativo: boolean, acao: string }>} */
export function valoresDasRegras(regras) {
  return Object.fromEntries(regras.map(({ campo, ativo, acao }) => [campo, { ativo, acao }]));
}

/**
 * Só as regras que mudaram, no formato do PUT. `null` = nada mudou.
 *
 * @param {Record<string, { ativo: boolean, acao: string }>} editadas
 * @param {RegraDuplicidade[]} originais
 */
export function regrasParaEnvio(editadas, originais) {
  const mudadas = originais
    .filter(
      ({ campo, ativo, acao }) =>
        editadas[campo] && (editadas[campo].ativo !== ativo || editadas[campo].acao !== acao),
    )
    .map(({ campo }) => ({ campo, ...editadas[campo] }));

  return mudadas.length > 0 ? mudadas : null;
}

// ---------------------------------------------------------------------------
// Import › Revisar

/** Valor do seletor que mantém a estratégia geral (a linha não vai em `acoes`). */
export const SEGUIR_ESTRATEGIA = '';

/**
 * Ações por linha duplicada. "Criar" não é oferecido onde a regra bloqueia
 * (o back daria 400).
 *
 * @param {DuplicadoDoImport} duplicado
 * @returns {{ valor: string, rotulo: string }[]}
 */
export function opcoesDeAcaoImport(duplicado) {
  const bloqueia = duplicado.acao === ACOES_DUPLICIDADE.BLOQUEAR;

  return ESTRATEGIAS_DUPLICATA.filter((acao) => !(bloqueia && acao === 'criar')).map((acao) => ({
    valor: acao,
    rotulo: ROTULOS_ESTRATEGIA[acao].rotulo,
  }));
}

/**
 * `{ [linha]: acao }` só das linhas com escolha própria; `null` sem nenhuma
 * (o confirm vai sem corpo de ações).
 *
 * @param {Record<string, string>} escolhas
 */
export function acoesParaEnvio(escolhas) {
  const acoes = Object.fromEntries(
    Object.entries(escolhas).filter(([, acao]) => acao !== SEGUIR_ESTRATEGIA),
  );
  return Object.keys(acoes).length > 0 ? acoes : null;
}
