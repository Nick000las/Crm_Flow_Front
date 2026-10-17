/**
 * Fábrica única das query keys do CRM. Invalidar por prefixo
 * (`crmKeys.leads()`) alcança todas as páginas/filtros de uma vez.
 */
export const crmKeys = {
  all: () => ['crm'],
  campos: () => ['crm', 'campos'],
  leads: () => ['crm', 'leads'],
  leadsSearch: (params) => ['crm', 'leads', params],
  lead: (id) => ['crm', 'lead', id],
  // Fora do prefixo `lead(id)`: recarregar o lead não recarrega as abas.
  atividades: (leadId) => ['crm', 'atividades', leadId],
  historico: (leadId) => ['crm', 'historico', leadId],
  views: () => ['crm', 'views'],
  usuarios: () => ['crm', 'usuarios'],
  camposConfigurados: () => ['crm', 'configuracoes', 'campos'],
  listas: () => ['crm', 'configuracoes', 'listas'],
  layout: () => ['crm', 'layout'],
  importJob: (jobId) => ['crm', 'import', jobId],
};
