/**
 * @file Fábrica única das query keys do CRM. Invalidar por prefixo (`crmKeys.leads()`) alcança
 * todas as páginas/filtros de uma vez.
 */
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
  // Prefixo de todos os quadros (o selo de alerta muda em todos ao marcar visto).
  quadros: () => ['crm', 'leads', 'quadro'],
  quadro: (ref) => [...crmKeys.quadros(), ref],
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
  // Forecast (FC2), também dentro do prefixo `leads()`: toda mutação do CRM que
  // invalida `leads()` (oportunidade, status, arquivo…) já recarrega o forecast.
  forecastTudo: () => ['crm', 'leads', 'forecast'],
  forecast: (params) => [...crmKeys.forecastTudo(), params],
  forecastLista: (params) => [...crmKeys.forecastTudo(), 'lista', params],
  // Assertividade (FC3): dentro do prefixo para recarregar junto com o resto do
  // forecast, embora os snapshots não mudem (o realizado de agora muda).
  forecastAssertividade: (params) => [...crmKeys.forecastTudo(), 'assertividade', params],
  // Fora do prefixo `lead(id)`: recarregar o lead não recarrega as abas.
  atividades: (leadId) => ['crm', 'atividades', leadId],
  historico: (leadId) => ['crm', 'historico', leadId],
  projetos: (leadId) => ['crm', 'projetos', leadId],
  oportunidades: (leadId) => ['crm', 'oportunidades', leadId],
  // Prefixo das oportunidades de todos os leads (ação em massa do forecast).
  oportunidadesTodas: () => ['crm', 'oportunidades'],
  linksDeFormulario: (leadId) => ['crm', 'formularios-da-pessoa', leadId],
  // Dentro do prefixo dos links: recarregar os links recarrega as respostas.
  respostasDeFormulario: (leadId) => ['crm', 'formularios-da-pessoa', leadId, 'respostas'],
  respostaDeFormulario: (leadId, id) => ['crm', 'formularios-da-pessoa', leadId, 'respostas', id],
  // Sem `todos`, o prefixo: alcança os não vistos (topo) e todos (aba).
  alertasDeFormulario: (leadId, todos) => [
    'crm',
    'formularios-da-pessoa',
    leadId,
    'alertas',
    ...(todos === undefined ? [] : [{ todos }]),
  ],
  formulariosDisponiveis: () => ['crm', 'formularios-disponiveis'],
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
  formularios: () => ['crm', 'configuracoes', 'formularios'],
  formulario: (id) => ['crm', 'configuracoes', 'formularios', id],
  formularioVersao: (id, versaoId) => [
    'crm',
    'configuracoes',
    'formularios',
    id,
    'versao',
    versaoId,
  ],
  // Fora do prefixo `formularios()`: mudar um campo recarrega só os elegíveis.
  formulariosElegiveis: () => ['crm', 'configuracoes', 'formularios-elegiveis'],
  // Prefixo de todos os leads abertos (`lead(id)`).
  leadsAbertos: () => ['crm', 'lead'],
  importJob: (jobId) => ['crm', 'import', jobId],
};
