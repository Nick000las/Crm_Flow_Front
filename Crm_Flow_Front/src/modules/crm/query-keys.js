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
  // Dentro do prefixo `leads()`: o que muda a lista muda o quadro, sem listar
  // o quadro em cada mutação do CRM.
  quadro: (ref) => ['crm', 'leads', 'quadro', ref],
  quadroColunas: (ref) => ['crm', 'leads', 'quadro', ref, 'colunas'],
  quadroCardsTodos: (ref) => [...crmKeys.quadro(ref), 'cards'],
  // Sem `consulta`/`filtros`, o prefixo da coluna: alcança todas as consultas dela.
  quadroCards: (ref, colunaRef, consulta) => [
    ...crmKeys.quadroCardsTodos(ref),
    colunaRef,
    ...(consulta ? [consulta] : []),
  ],
  quadroResumo: (ref, colunaRef, filtros) => [
    ...crmKeys.quadro(ref),
    'resumo',
    colunaRef,
    ...(filtros ? [filtros] : []),
  ],
  // Fora do prefixo `lead(id)`: recarregar o lead não recarrega as abas.
  atividades: (leadId) => ['crm', 'atividades', leadId],
  historico: (leadId) => ['crm', 'historico', leadId],
  projetos: (leadId) => ['crm', 'projetos', leadId],
  oportunidades: (leadId) => ['crm', 'oportunidades', leadId],
  oportunidadesNaLixeira: (leadId) => ['crm', 'oportunidades', leadId, 'lixeira'],
  // Prefixo do histórico de todos os leads (edição em massa).
  historicos: () => ['crm', 'historico'],
  // Lista fixa do filtro (M16): fora do prefixo `historicos()`.
  historicoCategorias: () => ['crm', 'historico-categorias'],
  views: () => ['crm', 'views'],
  usuarios: () => ['crm', 'usuarios'],
  camposConfigurados: () => ['crm', 'configuracoes', 'campos'],
  listas: () => ['crm', 'configuracoes', 'listas'],
  pipelines: () => ['crm', 'configuracoes', 'pipelines'],
  layout: () => ['crm', 'layout'],
  duplicidade: () => ['crm', 'configuracoes', 'duplicidade'],
  regras: () => ['crm', 'configuracoes', 'regras'],
  inatividade: () => ['crm', 'configuracoes', 'inatividade'],
  configCnpj: () => ['crm', 'configuracoes', 'cnpj'],
  distribuicao: () => ['crm', 'configuracoes', 'distribuicao'],
  permissoes: () => ['crm', 'configuracoes', 'permissoes'],
  configScore: () => ['crm', 'configuracoes', 'score'],
  lgpd: () => ['crm', 'configuracoes', 'lgpd'],
  // Prefixo de todos os leads abertos (`lead(id)`).
  leadsAbertos: () => ['crm', 'lead'],
  importJob: (jobId) => ['crm', 'import', jobId],
};
