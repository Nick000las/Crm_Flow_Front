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
  // Prefixo do histórico de todos os leads (edição em massa).
  historicos: () => ['crm', 'historico'],
  views: () => ['crm', 'views'],
  usuarios: () => ['crm', 'usuarios'],
  camposConfigurados: () => ['crm', 'configuracoes', 'campos'],
  listas: () => ['crm', 'configuracoes', 'listas'],
  layout: () => ['crm', 'layout'],
  duplicidade: () => ['crm', 'configuracoes', 'duplicidade'],
  regras: () => ['crm', 'configuracoes', 'regras'],
  inatividade: () => ['crm', 'configuracoes', 'inatividade'],
  configCnpj: () => ['crm', 'configuracoes', 'cnpj'],
  // Prefixo de todos os leads abertos (`lead(id)`).
  leadsAbertos: () => ['crm', 'lead'],
  importJob: (jobId) => ['crm', 'import', jobId],
};
