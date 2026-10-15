import { ROLES } from '../../lib/roles.js';

/**
 * Espelho de `Back/src/modules/nucleo/crm/constants.js`. Mudou lá, muda aqui
 * junto — o back continua sendo quem valida; isto só guia a interface.
 */

/** Papéis que configuram o CRM (campos, visibilidade) e fazem import/export. */
export const PAPEIS_GESTAO = Object.freeze([ROLES.DONO, ROLES.MASTER]);

export const CAMADA = Object.freeze({ CAMADA_1: 1, CAMADA_2: 2, CAMADA_3: 3 });

export const TIPOS_CAMPO = Object.freeze({
  TEXTO: 'texto',
  NUMERO: 'numero',
  DATA: 'data',
  BOOLEANO: 'booleano',
  SELECAO: 'selecao',
  SELECAO_MULTIPLA: 'selecao_multipla',
});

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

/** Confirmações breves (`role="status"`) — sem toast, por decisão do README. */
export const AVISOS_LEAD = Object.freeze({
  CRIADO: 'Lead criado.',
  SALVO: 'Alterações salvas.',
  EXCLUIDO: 'Lead excluído.',
});

export const ROTULOS_TIPO = Object.freeze({
  [TIPOS_CAMPO.TEXTO]: 'Texto',
  [TIPOS_CAMPO.NUMERO]: 'Número',
  [TIPOS_CAMPO.DATA]: 'Data',
  [TIPOS_CAMPO.BOOLEANO]: 'Sim/Não',
  [TIPOS_CAMPO.SELECAO]: 'Seleção',
  [TIPOS_CAMPO.SELECAO_MULTIPLA]: 'Seleção múltipla',
});

/**
 * Rótulo das 15 colunas da Camada 2 (espelho de `CAMADA_2_METADADOS` do
 * back). `/crm/field-visibility` só devolve a `coluna`, e `/fields` só traz
 * as visíveis — a página Campos precisa do rótulo de todas.
 */
export const ROTULOS_CAMADA_2 = Object.freeze({
  empresa: 'Empresa',
  cargo: 'Cargo',
  cpf: 'CPF',
  cnpj: 'CNPJ',
  cidade: 'Cidade',
  uf: 'UF',
  cep: 'CEP',
  endereco: 'Endereço',
  campanha_utm: 'Campanha (UTM)',
  data_conversao: 'Data de conversão',
  probabilidade_fechamento: 'Probabilidade de fechamento',
  data_prevista_fechamento: 'Data prevista de fechamento',
  motivo_perda: 'Motivo da perda',
  lead_score: 'Lead score',
  proximo_followup: 'Próximo follow-up',
});
