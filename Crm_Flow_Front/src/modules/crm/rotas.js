/**
 * @file Link do nome na linha — destino do foco quando o Sheet do lead fecha.
 */
/**
 * Caminhos e ids de foco do CRM em um lugar só: tabela, Sheet e página
 * navegam e devolvem o foco pelos mesmos nomes.
 */

/** Segmento de `/crm/leads/:leadId` que abre o Sheet em modo de criação. */
export const ID_NOVO_LEAD = 'novo';

/** Abas da ficha do lead; `state.aba` da navegação escolhe a inicial. */
export const ABAS_LEAD = Object.freeze({
  DADOS: 'dados',
  OPORTUNIDADES: 'oportunidades',
  ATIVIDADES: 'atividades',
  HISTORICO: 'historico',
  PROJETOS: 'projetos',
  FORMULARIOS: 'formularios',
});

export const ROTAS_CRM = Object.freeze({
  LISTA: '/crm',
  IMPORTAR: '/crm/importar',
  CONFIGURACOES: '/crm/configuracoes',
  FORECAST: '/crm/forecast',
  NOVO_LEAD: `/crm/leads/${ID_NOVO_LEAD}`,
  lead: (id) => `/crm/leads/${encodeURIComponent(id)}`,
  pipelineNaConfiguracao: (id) => `/crm/configuracoes/pipelines?pipeline=${encodeURIComponent(id)}`,
  // Sob `/kanban`: o quadro comercial é um quadro, e o Rail não troca de módulo.
  quadro: (pipelineId) => `/kanban/pipeline/${encodeURIComponent(pipelineId)}`,
});

/** Para onde o foco volta quando o Sheet de criação fecha. */
export const ID_BOTAO_NOVO_LEAD = 'crm-novo-lead';

/** Título do card no quadro — destino do foco quando a ficha fecha. */
export const idCardDoQuadro = (entidadeId) => `crm-card-${entidadeId}`;

/** Link do nome na linha — destino do foco quando o Sheet do lead fecha. */
export const idLinkDoLead = (id) => `crm-lead-${id}`;
