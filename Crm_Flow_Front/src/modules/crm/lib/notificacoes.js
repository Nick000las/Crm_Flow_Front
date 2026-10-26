import { ROTAS_CRM } from '../rotas.js';
import { escreverEstadoLista, estadoDaVisao } from './url-state.js';

/** Rota que o back grava em `dados.rota` para a lista de leads. */
const ROTA_LEADS_DO_BACK = '/crm/leads';

/**
 * Para onde vai uma notificação do CRM (`crm.esfriando`…). O back aponta a
 * lista como `/crm/leads`, que no front é `/crm` (`/crm/leads/:id` é o Sheet);
 * `dados.filtro` entra na URL como uma view aplicada. Com `dados.leadId`
 * (`crm.lead_atribuido`), abre o lead.
 *
 * @param {{ rota?: unknown, filtro?: unknown, leadId?: unknown } | null | undefined} dados
 * @returns {string | null}
 */
export function destinoCrm(dados) {
  if (dados?.rota !== ROTA_LEADS_DO_BACK) return null;
  if (typeof dados.leadId === 'string' && dados.leadId) return ROTAS_CRM.lead(dados.leadId);

  const filtros = dados.filtro && typeof dados.filtro === 'object' ? dados.filtro : null;
  const busca = escreverEstadoLista(new URLSearchParams(), estadoDaVisao(filtros)).toString();

  return busca ? `${ROTAS_CRM.LISTA}?${busca}` : ROTAS_CRM.LISTA;
}
