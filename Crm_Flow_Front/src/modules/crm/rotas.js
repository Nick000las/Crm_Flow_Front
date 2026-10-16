/**
 * Caminhos e ids de foco do CRM em um lugar só: tabela, Sheet e página
 * navegam e devolvem o foco pelos mesmos nomes.
 */

/** Segmento de `/crm/leads/:leadId` que abre o Sheet em modo de criação. */
export const ID_NOVO_LEAD = 'novo';

export const ROTAS_CRM = Object.freeze({
  LISTA: '/crm',
  IMPORTAR: '/crm/importar',
  CONFIGURACOES: '/crm/configuracoes',
  NOVO_LEAD: `/crm/leads/${ID_NOVO_LEAD}`,
  lead: (id) => `/crm/leads/${encodeURIComponent(id)}`,
});

/** Para onde o foco volta quando o Sheet de criação fecha. */
export const ID_BOTAO_NOVO_LEAD = 'crm-novo-lead';

/** Link do nome na linha — destino do foco quando o Sheet do lead fecha. */
export const idLinkDoLead = (id) => `crm-lead-${id}`;
