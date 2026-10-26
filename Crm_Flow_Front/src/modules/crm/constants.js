import { ROLES } from '../../lib/roles.js';

/**
 * Espelho de `Back/src/modules/nucleo/crm/constants.js`. Mudou lá, muda aqui
 * junto — o back continua sendo quem valida; isto só guia a interface.
 */

/** Papéis que configuram o CRM (campos, visibilidade) e fazem import/export. */
export const PAPEIS_GESTAO = Object.freeze([ROLES.DONO, ROLES.MASTER]);

/**
 * Feature flags do CRM (rollout gradual, não cobrança). Ligadas por tenant
 * pelo MASTER; chegam em `/auth/me` → `featuresAtivas`. Desligada = a
 * interface de antes. Use com `feature` no registry ou `temFeature`.
 */
export const CRM_FEATURES = Object.freeze({
  LISTAS: 'crm.listas',
  LAYOUT: 'crm.layout',
  ARQUIVO: 'crm.arquivo',
  ATIVIDADES: 'crm.atividades',
  DUPLICIDADE: 'crm.duplicidade',
  REGRAS: 'crm.regras',
  INATIVIDADE: 'crm.inatividade',
  MASSA: 'crm.massa',
  CNPJ: 'crm.cnpj',
  DISTRIBUICAO: 'crm.distribuicao',
  PERMISSOES: 'crm.permissoes',
  SCORE: 'crm.score',
  LGPD: 'crm.lgpd',
  TIMELINE: 'crm.timeline',
});

/** Listas do tenant (Configurações › Listas); `:tipo` das rotas e `campo.lista`. */
export const TIPOS_LISTA = Object.freeze({
  STATUS: 'status',
  FONTE_LEAD: 'fonte_lead',
  MOTIVO_PERDA: 'motivo_perda',
  TIPO_ATIVIDADE: 'tipo_atividade',
  TAG: 'tag',
});

export const ROTULOS_LISTA = Object.freeze({
  [TIPOS_LISTA.STATUS]: 'Status',
  [TIPOS_LISTA.FONTE_LEAD]: 'Origem',
  [TIPOS_LISTA.MOTIVO_PERDA]: 'Motivos de perda',
  [TIPOS_LISTA.TIPO_ATIVIDADE]: 'Tipos de atividade',
  [TIPOS_LISTA.TAG]: 'Tags',
});

/** Só em status (obrigatória lá, proibida no resto). Relatórios e regras usam a categoria, não o nome. */
export const CATEGORIAS_STATUS = Object.freeze({ ABERTO: 'aberto', GANHO: 'ganho', PERDIDO: 'perdido' });

export const ROTULOS_CATEGORIA = Object.freeze({
  [CATEGORIAS_STATUS.ABERTO]: 'Aberto',
  [CATEGORIAS_STATUS.GANHO]: 'Ganho',
  [CATEGORIAS_STATUS.PERDIDO]: 'Perdido',
});

/**
 * Layout do lead (flag `crm.layout`): espelho de `constants/layout.js` do
 * back. Referência fixa = dado do lead que não é campo configurável; `coluna`
 * é a propriedade do lead lido.
 */
export const REFERENCIAS_FIXAS = Object.freeze({
  'lead.valor': { chave: 'valor', label: 'Valor', tipo: 'monetario', coluna: 'valor' },
  'lead.responsavel': { chave: 'usuarioResponsavelId', label: 'Responsável', tipo: 'usuario', coluna: 'usuario_responsavel_id' },
  'lead.estagio': { chave: 'funilEstagio', label: 'Estágio do funil', tipo: 'texto', coluna: 'estagio_nome' },
  'lead.criadoEm': { chave: 'createdAt', label: 'Criado em', tipo: 'data', coluna: 'created_at' },
});

export const LIMITES_LAYOUT = Object.freeze({ SUBTITULO: 2, DESTAQUES: 4, SECOES: 12, NOME_SECAO: 60 });

/** Campos do sistema que podem ser identificador; personalizado pode, se for texto. */
export const CHAVES_IDENTIFICADOR = Object.freeze(['nome', 'empresa', 'cnpj', 'cpf', 'email']);

/** Telas que consomem os campos; `visibilidade[contexto]` de cada campo. */
export const CONTEXTO = Object.freeze({
  CRIACAO: 'create_form',
  FICHA: 'detail',
  TABELA: 'table',
  FILTRO: 'filter',
});

export const ROTULOS_CONTEXTO = Object.freeze({
  [CONTEXTO.CRIACAO]: 'Criação',
  [CONTEXTO.FICHA]: 'Ficha',
  [CONTEXTO.TABELA]: 'Tabela',
  [CONTEXTO.FILTRO]: 'Filtros',
});

export const CAMADA = Object.freeze({ CAMADA_1: 1, CAMADA_2: 2, CAMADA_3: 3 });

export const TIPOS_CAMPO = Object.freeze({
  TEXTO: 'texto',
  NUMERO: 'numero',
  DATA: 'data',
  BOOLEANO: 'booleano',
  SELECAO: 'selecao',
  SELECAO_MULTIPLA: 'selecao_multipla',
  TEXTO_LONGO: 'texto_longo',
  MONETARIO: 'monetario',
  TELEFONE: 'telefone',
  EMAIL: 'email',
  URL: 'url',
  // M11: documentos (sem máscara no back), hora, usuário, período e endereço.
  CPF: 'cpf',
  CNPJ: 'cnpj',
  CEP: 'cep',
  HORA: 'hora',
  USUARIO: 'usuario',
  INTERVALO_DATAS: 'intervalo_datas',
  ENDERECO: 'endereco',
});

/** Partes do tipo `endereco`, na ordem do back (`PARTES_ENDERECO`). */
export const PARTES_ENDERECO = Object.freeze(['cep', 'logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'uf']);

export const ROTULOS_PARTE_ENDERECO = Object.freeze({
  cep: 'CEP',
  logradouro: 'Logradouro',
  numero: 'Número',
  complemento: 'Complemento',
  bairro: 'Bairro',
  cidade: 'Cidade',
  uf: 'UF',
});

export const LIMITE_TEXTO_LONGO = 10_000;

export const TIPOS_COM_OPCOES = Object.freeze([
  TIPOS_CAMPO.SELECAO,
  TIPOS_CAMPO.SELECAO_MULTIPLA,
]);

/** Operadores aceitos em `filtros[].operador` de `POST /crm/leads/search`. */
export const OPERADORES_POR_TIPO = Object.freeze({
  texto: ['igual', 'contem', 'e_um_dos', 'vazio', 'nao_vazio'],
  numero: ['igual', 'entre', 'vazio', 'nao_vazio'],
  data: ['igual', 'entre', 'vazio', 'nao_vazio'],
  booleano: ['igual', 'vazio', 'nao_vazio'],
  selecao: ['igual', 'e_um_dos', 'vazio', 'nao_vazio'],
  selecao_multipla: ['contem', 'e_um_dos', 'vazio', 'nao_vazio'],
  texto_longo: ['contem', 'vazio', 'nao_vazio'],
  monetario: ['igual', 'entre', 'vazio', 'nao_vazio'],
  telefone: ['igual', 'contem', 'vazio', 'nao_vazio'],
  email: ['igual', 'contem', 'e_um_dos', 'vazio', 'nao_vazio'],
  url: ['igual', 'contem', 'vazio', 'nao_vazio'],
  cpf: ['igual', 'contem', 'vazio', 'nao_vazio'],
  cnpj: ['igual', 'contem', 'vazio', 'nao_vazio'],
  cep: ['igual', 'contem', 'vazio', 'nao_vazio'],
  endereco: ['contem', 'vazio', 'nao_vazio'],
  usuario: ['igual', 'e_um_dos', 'vazio', 'nao_vazio'],
  // `entre` no período = os dois períodos se sobrepõem.
  intervalo_datas: ['entre', 'vazio', 'nao_vazio'],
  hora: ['igual', 'entre', 'vazio', 'nao_vazio'],
});

export const BUSCA_LEADS = Object.freeze({
  TAMANHO_PADRAO: 50,
  TAMANHO_MAXIMO: 200,
  MAX_FILTROS: 20,
});

/** Opções do seletor de tamanho de página (todas ≤ `TAMANHO_MAXIMO`). */
export const TAMANHOS_PAGINA = Object.freeze([25, 50, 100, 200]);

/** Espera entre a última tecla na busca e a nova consulta. */
export const BUSCA_DEBOUNCE_MS = 300;

/** Colunas de planilha fora de `/crm/leads/fields` (import/export). */
export const CAMPOS_EXTRAS_PLANILHA = Object.freeze([
  { chave: 'valor', label: 'Valor', tipo: TIPOS_CAMPO.NUMERO, obrigatorio: false },
  { chave: 'funilEstagio', label: 'Estágio do funil', tipo: TIPOS_CAMPO.TEXTO, obrigatorio: false },
]);

export const ESTRATEGIAS_DUPLICATA = Object.freeze(['pular', 'atualizar', 'criar']);

/** Duplicata = mesmo e-mail ou mesmo telefone (só dígitos) de um lead existente. */
export const ROTULOS_ESTRATEGIA = Object.freeze({
  pular: {
    rotulo: 'Pular',
    descricao: 'O lead que já existe fica como está; a linha da planilha é ignorada.',
  },
  atualizar: {
    rotulo: 'Atualizar',
    descricao: 'O lead que já existe recebe os dados da planilha.',
  },
  criar: {
    rotulo: 'Criar mesmo assim',
    descricao: 'Cria um lead novo para cada linha, mesmo que fique duplicado.',
  },
});

export const IMPORT_JOB_STATUS = Object.freeze({
  PENDENTE: 'pendente',
  PROCESSANDO: 'processando',
  CONCLUIDO: 'concluido',
  FALHOU: 'falhou',
});

export const IMPORTACAO = Object.freeze({
  MAX_LINHAS: 5_000,
  TAMANHO_MAXIMO_ARQUIVO_BYTES: 10 * 1024 * 1024,
});

export const EXPORTACAO = Object.freeze({
  MAX_LINHAS: 10_000,
  NOME_ARQUIVO: 'leads.xlsx',
});

/** Formatos do export; `csv` só com `crm.massa` (sem a flag, o back dá 403). */
export const FORMATOS_EXPORTACAO = Object.freeze({ XLSX: 'xlsx', CSV: 'csv' });

/** Edição em massa (`crm.massa`): espelho do limite do back. */
export const BULK = Object.freeze({ MAX_IDS: 200 });

/** Distribuição automática (`crm.distribuicao`): espelho dos limites do back. */
export const DISTRIBUICAO = Object.freeze({ MAX_REGRAS: 50, MAX_CONDICOES: 10 });

/** O que acontece quando nenhuma regra de distribuição casa. */
export const FALLBACK_DISTRIBUICAO = Object.freeze({
  RODIZIO_GERAL: 'rodizio_geral',
  SEM_RESPONSAVEL: 'sem_responsavel',
});

export const ROTULOS_FALLBACK = Object.freeze({
  rodizio_geral: 'Rodízio geral (DONO e OPERADOR ativos)',
  sem_responsavel: 'Deixar sem responsável',
});

export const TIPOS_DESTINO = Object.freeze({ USUARIO: 'usuario', GRUPO: 'grupo' });

/** De onde veio o responsável (`detalhes.distribuicao.origem` no evento `criado`). */
export const ORIGEM_DISTRIBUICAO = Object.freeze({
  REGRA: 'regra',
  RODIZIO_GERAL: 'rodizio_geral',
  SEM_RESPONSAVEL: 'sem_responsavel',
});

/** Confirmações breves (`role="status"`) — sem toast, por decisão do README. */
export const AVISOS_LEAD = Object.freeze({
  CRIADO: 'Lead criado.',
  SALVO: 'Alterações salvas.',
  EXCLUIDO: 'Lead excluído.',
  NA_LIXEIRA: 'Lead enviado para a lixeira.',
  ARQUIVADO: 'Lead arquivado.',
  DESARQUIVADO: 'Lead desarquivado.',
  RESTAURADO: 'Lead restaurado.',
  RESTAURADO_ARQUIVADO: 'Lead restaurado em Arquivados.',
  MESCLADO: 'Leads mesclados.',
});

/** Filtro fixo da busca (`crm.arquivo`): não é filtro de campo nem vira chip. */
export const SITUACOES_LEAD = Object.freeze({
  ATIVOS: 'ativos',
  ARQUIVADOS: 'arquivados',
  LIXEIRA: 'lixeira',
});

export const ROTULOS_SITUACAO = Object.freeze({
  [SITUACOES_LEAD.ATIVOS]: 'Ativos',
  [SITUACOES_LEAD.ARQUIVADOS]: 'Arquivados',
  [SITUACOES_LEAD.LIXEIRA]: 'Lixeira',
});

/**
 * Lead esfriando (`crm.inatividade`): espelho de `DIAS_ESFRIAR` do back.
 * `DIAS_PADRAO` é só a sugestão ao ligar um status sem dias.
 */
export const INATIVIDADE = Object.freeze({ DIAS_MIN: 1, DIAS_MAX: 365, DIAS_PADRAO: 7 });

/** Prazo para restaurar um lead excluído (o back purga depois). */
export const DIAS_NA_LIXEIRA = 30;

/** Espelho dos limites do back (`LIMITES_ATIVIDADE`). */
export const LIMITES_ATIVIDADE = Object.freeze({ TITULO: 200, NOTAS: 5000 });

/** Página do histórico do lead (o back aceita até 200). */
export const TAMANHO_HISTORICO = 50;

export const TIPOS_EVENTO = Object.freeze({
  CRIADO: 'criado',
  ATUALIZADO: 'atualizado',
  ARQUIVADO: 'arquivado',
  DESARQUIVADO: 'desarquivado',
  EXCLUIDO: 'excluido',
  RESTAURADO: 'restaurado',
  MESCLADO: 'mesclado',
  // M11b: dados da Receita aplicados pelo enriquecimento automático (autor nulo).
  ENRIQUECIDO: 'enriquecido',
});

/** Regras de duplicidade (`crm.duplicidade`): por campo, avisar ou bloquear. */
export const ACOES_DUPLICIDADE = Object.freeze({ AVISAR: 'warn', BLOQUEAR: 'block' });

export const ROTULOS_ACAO_DUPLICIDADE = Object.freeze({
  [ACOES_DUPLICIDADE.AVISAR]: 'Avisar',
  [ACOES_DUPLICIDADE.BLOQUEAR]: 'Bloquear',
});

/** 409 ao salvar lead: os candidatos vêm em `error.details.duplicados`. */
export const CODIGOS_DUPLICIDADE = Object.freeze({
  AVISO: 'DUPLICATE_WARNING',
  BLOQUEIO: 'DUPLICATE_BLOCKED',
});

/** Regras de campo (`crm.regras`). */
export const TIPOS_REGRA = Object.freeze({
  POR_STATUS: 'required_from_status',
  CONDICIONAL: 'conditional',
});

export const ROTULOS_TIPO_REGRA = Object.freeze({
  [TIPOS_REGRA.POR_STATUS]: 'Obrigatório por status',
  [TIPOS_REGRA.CONDICIONAL]: 'Condicional',
});

/** Campos que as regras checam — `chave` no form (`/fields`) e no corpo da checagem. */
export const CAMPOS_DUPLICIDADE = Object.freeze(['email', 'telefone', 'cnpj', 'cpf']);

export const ROTULOS_TIPO = Object.freeze({
  [TIPOS_CAMPO.TEXTO]: 'Texto',
  [TIPOS_CAMPO.NUMERO]: 'Número',
  [TIPOS_CAMPO.DATA]: 'Data',
  [TIPOS_CAMPO.BOOLEANO]: 'Sim/Não',
  [TIPOS_CAMPO.SELECAO]: 'Seleção',
  [TIPOS_CAMPO.SELECAO_MULTIPLA]: 'Seleção múltipla',
  [TIPOS_CAMPO.TEXTO_LONGO]: 'Texto longo',
  [TIPOS_CAMPO.MONETARIO]: 'Monetário (R$)',
  [TIPOS_CAMPO.TELEFONE]: 'Telefone',
  [TIPOS_CAMPO.EMAIL]: 'E-mail',
  [TIPOS_CAMPO.URL]: 'URL',
  [TIPOS_CAMPO.CPF]: 'CPF',
  [TIPOS_CAMPO.CNPJ]: 'CNPJ',
  [TIPOS_CAMPO.CEP]: 'CEP',
  [TIPOS_CAMPO.HORA]: 'Hora',
  [TIPOS_CAMPO.USUARIO]: 'Usuário',
  [TIPOS_CAMPO.INTERVALO_DATAS]: 'Período (de/até)',
  [TIPOS_CAMPO.ENDERECO]: 'Endereço',
});
