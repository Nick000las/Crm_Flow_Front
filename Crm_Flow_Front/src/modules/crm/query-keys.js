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
  views: () => ['crm', 'views'],
  usuarios: () => ['crm', 'usuarios'],
  definicoes: () => ['crm', 'definicoes'],
  visibilidade: () => ['crm', 'visibilidade'],
  importJob: (jobId) => ['crm', 'import', jobId],
};
