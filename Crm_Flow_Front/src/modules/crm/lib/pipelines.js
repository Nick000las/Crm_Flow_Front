/**
 * @file Nova ordem dos status de um pipeline, para o cache otimista.
 */
import {
  CATEGORIAS_STATUS,
  REGRAS_DONO_ATENDIMENTO,
  ROTULOS_REGRA_DONO,
  TIPOS_PIPELINE,
} from '../constants.js';

/**
 * Pipelines do tenant (M2.5). Regras de exibição: quem valida é o back, e o
 * que aparece travado aqui também volta como 409 de lá.
 *
 * @typedef {import('../api/pipelines.api.js').Pipeline} Pipeline
 * @typedef {import('../api/pipelines.api.js').Automacao} Automacao
 * @typedef {{
 *   ativa: boolean,
 *   origemId: string,
 *   statusInicial: string,
 *   regraDoDono: string,
 *   donoId: string,
 * }} ValoresAutomacao
 */

const paraSeletor = (status) => ({ valor: status.key, rotulo: status.label });

/**
 * A key de status pode repetir entre pipelines: procure sempre dentro de um.
 *
 * @param {Pipeline[]} pipelines
 * @param {string} pipelineId
 * @param {string | null | undefined} key
 */
export function statusDoPipeline(pipelines, pipelineId, key) {
  const pipeline = pipelines.find((item) => item.id === pipelineId);

  return pipeline?.status.find((status) => status.key === key) ?? null;
}

/**
 * Status abertos e ativos, para o seletor (automação e criar oportunidade).
 *
 * @param {Pipeline | undefined} pipeline
 */
export function statusAbertos(pipeline) {
  return (pipeline?.status ?? [])
    .filter((status) => status.ativo && status.category === CATEGORIAS_STATUS.ABERTO)
    .map(paraSeletor);
}

/**
 * Status para onde a oportunidade pode ir: os ativos, mais o atual, se ele
 * estiver desativado.
 *
 * @param {Pipeline | undefined} pipeline
 * @param {string | undefined} atual
 */
export function statusDisponiveis(pipeline, atual) {
  return (pipeline?.status ?? [])
    .filter((status) => status.ativo || status.key === atual)
    .map(paraSeletor);
}

/** @param {Pipeline[]} pipelines */
export function pipelinesAtivos(pipelines) {
  return pipelines
    .filter((pipeline) => pipeline.ativo)
    .map((pipeline) => ({ valor: pipeline.id, rotulo: pipeline.nome }));
}

/**
 * De onde a automação pode nascer: vendas ativas.
 *
 * @param {Pipeline[]} pipelines
 */
export function origensDaAutomacao(pipelines) {
  return pipelines
    .filter((pipeline) => pipeline.ativo && pipeline.tipo === TIPOS_PIPELINE.VENDAS)
    .map((pipeline) => ({ valor: pipeline.id, rotulo: pipeline.nome }));
}

/**
 * @param {Automacao} automacao
 * @returns {ValoresAutomacao}
 */
export function valoresDaAutomacao({ ativa, origemId, statusInicial, regraDoDono, donoId }) {
  return {
    ativa,
    origemId: origemId ?? '',
    statusInicial: statusInicial ?? '',
    regraDoDono,
    donoId: donoId ?? '',
  };
}

/**
 * O dono só vale com "usuário específico".
 *
 * @param {ValoresAutomacao} valores
 * @returns {Automacao}
 */
export function payloadDaAutomacao({ ativa, origemId, statusInicial, regraDoDono, donoId }) {
  return {
    ativa,
    origemId: origemId || null,
    statusInicial: statusInicial || null,
    regraDoDono,
    donoId: regraDoDono === REGRAS_DONO_ATENDIMENTO.USUARIO ? donoId || null : null,
  };
}

/**
 * Frase da automação para quem só lê.
 *
 * @param {Pipeline} pipeline
 * @param {Pipeline[]} pipelines
 * @param {Map<string, string>} nomePorId
 */
export function resumoDaAutomacao({ id, automacao }, pipelines, nomePorId) {
  if (!automacao.ativa) {
    return 'Desligada.';
  }

  const origem = pipelines.find((item) => item.id === automacao.origemId)?.nome ?? 'outro pipeline';
  const status = statusDoPipeline(pipelines, id, automacao.statusInicial)?.label ?? 'sem status';
  const dono =
    automacao.regraDoDono === REGRAS_DONO_ATENDIMENTO.USUARIO
      ? (nomePorId.get(automacao.donoId) ?? 'Usuário removido')
      : ROTULOS_REGRA_DONO[automacao.regraDoDono];

  return `Venda ganha em ${origem} cria um card em ${status}. Responsável: ${dono}.`;
}

/**
 * @param {Pipeline} pipeline
 * @returns {string | null}
 */
export function motivoNaoDesativa(pipeline) {
  return pipeline.padrao ? 'O pipeline padrão não pode ser desativado.' : null;
}

/**
 * @param {Pipeline} pipeline
 * @param {Pipeline[]} pipelines
 * @returns {string | null}
 */
export function motivoNaoExclui(pipeline, pipelines) {
  if (pipeline.padrao) {
    return 'O pipeline padrão não pode ser excluído.';
  }

  if (pipeline.oportunidades > 0) {
    return 'Tem oportunidades. Desative em vez de excluir.';
  }

  const ehOrigem = pipelines.some(
    (outro) => outro.id !== pipeline.id && outro.automacao.origemId === pipeline.id,
  );

  return ehOrigem ? 'Outro pipeline nasce deste. Mude a automação dele antes.' : null;
}

/**
 * Nova ordem dos status de um pipeline, para o cache otimista.
 *
 * @param {Pipeline[]} pipelines
 * @param {string} pipelineId
 * @param {string[]} ids
 * @returns {Pipeline[]}
 */
export function comStatusReordenados(pipelines, pipelineId, ids) {
  return pipelines.map((pipeline) => {
    if (pipeline.id !== pipelineId) {
      return pipeline;
    }

    const porId = new Map(pipeline.status.map((status) => [status.id, status]));

    return { ...pipeline, status: ids.map((id) => porId.get(id)).filter(Boolean) };
  });
}
