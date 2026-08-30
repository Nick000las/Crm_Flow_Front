import {
  CAMADA,
  CHAVES_IDENTIFICADOR,
  LIMITES_LAYOUT,
  REFERENCIAS_FIXAS,
  TIPOS_CAMPO,
} from '../constants.js';
import { TIPO_COLUNA, lerValorDoCampo } from './colunas.js';
import {
  formatarCep,
  formatarCnpj,
  formatarCpf,
  formatarData,
  formatarEndereco,
  formatarInstante,
  formatarIntervalo,
  formatarMoeda,
  formatarNumero,
  formatarTelefone,
} from './formatadores.js';
import { rotuloOpcao } from './opcoes.js';

/**
 * Layout do lead (flag `crm.layout`): identificador, subtítulo, destaques,
 * seções da ficha e colunas padrão. O back resolve o `efetivo` (padrão do
 * tenant + override do usuário, já filtrado pela visibilidade); aqui ficam
 * a leitura dele e as regras do editor.
 *
 * @typedef {{
 *   ref: string, chave: string, label: string, tipo: string,
 *   camada?: number, coluna?: string, opcoesLista?: import('./opcoes.js').Opcao[],
 * }} ItemLayout
 * @typedef {{
 *   identificador: ItemLayout,
 *   subtitulo: ItemLayout[],
 *   destaques: ItemLayout[],
 *   secoes: { nome: string, automatica: boolean, campos: ItemLayout[] }[],
 *   colunas: ItemLayout[],
 * }} LayoutEfetivo
 * @typedef {{
 *   identificador: string,
 *   subtitulo: string[],
 *   destaques: string[],
 *   secoes: { nome: string, campos: string[] }[],
 *   colunas: string[],
 * }} LayoutRefs  `padrao`/`meu`: só referências (`id` de campo ou `lead.*`)
 */

/** O que o editor está editando: o padrão da empresa ou o layout próprio. */
export const MODO = Object.freeze({ PADRAO: 'padrao', MEU: 'meu' });

export const PARTES_LAYOUT = Object.freeze([
  'identificador',
  'subtitulo',
  'destaques',
  'secoes',
  'colunas',
]);
export const SEM_NOME = 'Lead sem nome';
const SEPARADOR_SUBTITULO = ' · ';
const REF_CRIADO_EM = 'lead.criadoEm';

/** Referência fixa → coluna que a tabela já conhece. */
const COLUNA_DA_REF = Object.freeze({
  'lead.valor': { id: 'valor', tipo: TIPO_COLUNA.MOEDA },
  'lead.responsavel': { id: 'responsavel', tipo: TIPO_COLUNA.RESPONSAVEL },
  [REF_CRIADO_EM]: { id: 'criadoEm', tipo: TIPO_COLUNA.INSTANTE },
});

export const MENSAGENS_LAYOUT = Object.freeze({
  IDENTIFICADOR: 'Escolha o identificador',
  SUBTITULO: `Use até ${LIMITES_LAYOUT.SUBTITULO} campos no subtítulo`,
  DESTAQUES: `Use até ${LIMITES_LAYOUT.DESTAQUES} destaques`,
  SECOES: `Use até ${LIMITES_LAYOUT.SECOES} seções`,
  NOME_SECAO: 'Dê um nome a cada seção',
  SECAO_REPETIDA: 'Há seções com o mesmo nome',
  CAMPO_EM_DUAS_SECOES: 'Um campo só pode ficar em uma seção',
  COLUNAS: 'Escolha ao menos uma coluna',
});

// ---------------------------------------------------------------------------
// Leitura do lead pelo layout

/**
 * Valor de um campo do lead como texto de exibição (título, subtítulo).
 * Mesmo critério de formatação da tabela, sem JSX.
 *
 * @param {ItemLayout} item
 * @param {unknown} valor
 * @param {Map<string, string>} [nomePorId] para o responsável
 * @returns {string | null}
 */
export function textoDoValor(item, valor, nomePorId) {
  const vazio =
    valor === null ||
    valor === undefined ||
    valor === '' ||
    (Array.isArray(valor) && valor.length === 0);
  if (vazio) {
    return null;
  }

  if (item.ref === REF_CRIADO_EM) {
    return formatarInstante(valor);
  }
  switch (item.tipo) {
    // M11: documentos gravados sem máscara; o front aplica.
    case TIPOS_CAMPO.CPF:
      return formatarCpf(valor);
    case TIPOS_CAMPO.CNPJ:
      return formatarCnpj(valor);
    case TIPOS_CAMPO.CEP:
      return formatarCep(valor);
    case TIPOS_CAMPO.INTERVALO_DATAS:
      return formatarIntervalo(valor);
    case TIPOS_CAMPO.ENDERECO:
      return formatarEndereco(valor);
    case TIPOS_CAMPO.MONETARIO:
      return formatarMoeda(valor);
    case TIPOS_CAMPO.NUMERO:
      return formatarNumero(valor);
    case TIPOS_CAMPO.DATA:
      return formatarData(valor);
    case TIPOS_CAMPO.TELEFONE:
      return formatarTelefone(valor);
    case TIPOS_CAMPO.BOOLEANO:
      return valor ? 'Sim' : 'Não';
    case TIPOS_CAMPO.SELECAO:
      return rotuloOpcao(valor, item);
    case TIPOS_CAMPO.SELECAO_MULTIPLA:
      return [valor]
        .flat()
        .map((opcao) => rotuloOpcao(opcao, item))
        .join(', ');
    case TIPOS_CAMPO.USUARIO:
      return nomePorId?.get(String(valor)) ?? null;
    default:
      return String(valor).trim() || null;
  }
}

/** @param {import('../types.js').Lead} lead @param {ItemLayout} item */
export function valorDoItem(lead, item) {
  return lerValorDoCampo(lead, /** @type {any} */ (item));
}

/**
 * Título do lead: o identificador; vazio, o Nome; sem Nome, "Lead sem nome".
 *
 * @param {import('../types.js').Lead} lead
 * @param {ItemLayout | null | undefined} identificador
 */
export function tituloDoLead(lead, identificador) {
  const doIdentificador = identificador
    ? textoDoValor(identificador, valorDoItem(lead, identificador))
    : null;
  return doIdentificador || lead.nome?.trim() || SEM_NOME;
}

/**
 * Subtítulo: os campos preenchidos, unidos por " · ". Vazio = `''`.
 *
 * @param {import('../types.js').Lead} lead
 * @param {ItemLayout[]} itens
 * @param {Map<string, string>} [nomePorId]
 */
export function subtituloDoLead(lead, itens, nomePorId) {
  return itens
    .map((item) => textoDoValor(item, valorDoItem(lead, item), nomePorId))
    .filter(Boolean)
    .join(SEPARADOR_SUBTITULO);
}

/**
 * Item do layout → coluna da tabela. As referências fixas usam as colunas
 * que a tabela já tem (`valor`, `responsavel`, `criadoEm`).
 *
 * @param {ItemLayout} item
 * @returns {import('./colunas.js').Coluna}
 */
export function colunaDoItem(item) {
  const fixa = COLUNA_DA_REF[item.ref];
  return fixa
    ? { id: fixa.id, label: item.label, tipo: fixa.tipo }
    : { id: item.chave, label: item.label, tipo: item.tipo, campo: /** @type {any} */ (item) };
}

/** Ids das colunas padrão do layout, para `sanearSelecao`. @param {ItemLayout[]} itens */
export function idsDasColunas(itens) {
  return itens.map((item) => colunaDoItem(item).id);
}

// ---------------------------------------------------------------------------
// Editor

/**
 * Pode ser identificador: Nome, Empresa, CNPJ, CPF, E-mail ou personalizado
 * de texto (o back valida de novo).
 *
 * @param {{ chave: string, tipo: string, camada: number }} campo
 */
export function identificadorPermitido(campo) {
  if (campo.camada === CAMADA.CAMADA_3) {
    return campo.tipo === TIPOS_CAMPO.TEXTO;
  }
  return CHAVES_IDENTIFICADOR.includes(campo.chave);
}

/**
 * Tudo o que o editor oferece: campos de `/fields` (pelo `id`) e as
 * referências fixas.
 *
 * @param {{ id: string, chave: string, label: string, tipo: string, camada: number }[]} campos
 * @returns {{ ref: string, label: string, tipo: string, chave: string, camada?: number }[]}
 */
export function opcoesDoEditor(campos) {
  const deCampos = campos
    .filter((campo) => campo.id)
    .map((campo) => ({
      ref: campo.id,
      label: campo.label,
      tipo: campo.tipo,
      chave: campo.chave,
      camada: campo.camada,
    }));
  const fixas = Object.entries(REFERENCIAS_FIXAS).map(([ref, fixa]) => ({
    ref,
    label: fixa.label,
    tipo: fixa.tipo,
    chave: fixa.chave,
  }));

  return [...deCampos, ...fixas];
}

/**
 * Layout em referências para o editor. Do `efetivo` (base do "Só para
 * mim"), tira a seção automática — ela é calculada pelo back, não se edita.
 *
 * @param {LayoutRefs | LayoutEfetivo} fonte
 * @returns {LayoutRefs}
 */
export function layoutDoEditor(fonte) {
  const ref = (item) => (typeof item === 'string' ? item : item.ref);

  return {
    identificador: fonte.identificador ? ref(fonte.identificador) : '',
    subtitulo: fonte.subtitulo.map(ref),
    destaques: fonte.destaques.map(ref),
    secoes: fonte.secoes
      .filter((secao) => !secao.automatica)
      .map((secao) => ({ nome: secao.nome, campos: secao.campos.map(ref) })),
    colunas: fonte.colunas.map(ref),
  };
}

/**
 * Override parcial: só as partes que mudaram em relação à base.
 *
 * @param {LayoutRefs} base
 * @param {LayoutRefs} editado
 * @returns {Partial<LayoutRefs>}
 */
export function parcialDoMeu(base, editado) {
  return Object.fromEntries(
    PARTES_LAYOUT.filter(
      (parte) => JSON.stringify(base[parte]) !== JSON.stringify(editado[parte]),
    ).map((parte) => [parte, editado[parte]]),
  );
}

/**
 * Validação de UX por parte (`{ subtitulo: mensagem }`), espelhando o 400
 * do back: limites, nomes de seção e campo em duas seções.
 *
 * @param {LayoutRefs} layout
 */
export function validarLayout(layout) {
  const erros = {};
  const nomes = layout.secoes.map((secao) => secao.nome.trim().toLocaleLowerCase('pt-BR'));
  const camposEmSecoes = layout.secoes.flatMap((secao) => secao.campos);

  if (!layout.identificador) {
    erros.identificador = MENSAGENS_LAYOUT.IDENTIFICADOR;
  }
  if (layout.subtitulo.length > LIMITES_LAYOUT.SUBTITULO) {
    erros.subtitulo = MENSAGENS_LAYOUT.SUBTITULO;
  }
  if (layout.destaques.length > LIMITES_LAYOUT.DESTAQUES) {
    erros.destaques = MENSAGENS_LAYOUT.DESTAQUES;
  }
  if (layout.colunas.length === 0) {
    erros.colunas = MENSAGENS_LAYOUT.COLUNAS;
  }

  if (layout.secoes.length > LIMITES_LAYOUT.SECOES) {
    erros.secoes = MENSAGENS_LAYOUT.SECOES;
  } else if (nomes.some((nome) => nome === '')) {
    erros.secoes = MENSAGENS_LAYOUT.NOME_SECAO;
  } else if (new Set(nomes).size !== nomes.length) {
    erros.secoes = MENSAGENS_LAYOUT.SECAO_REPETIDA;
  } else if (new Set(camposEmSecoes).size !== camposEmSecoes.length) {
    erros.secoes = MENSAGENS_LAYOUT.CAMPO_EM_DUAS_SECOES;
  }

  return erros;
}

/** Nome das seções aparadas, como o back grava. @param {LayoutRefs} layout */
export function layoutParaEnvio(layout) {
  return {
    ...layout,
    secoes: layout.secoes.map((secao) => ({ ...secao, nome: secao.nome.trim() })),
  };
}

/** Já entram na busca de qualquer jeito (o identificador do tenant é somado a elas). */
const CHAVES_SEMPRE_BUSCADAS = Object.freeze(['nome', 'email', 'telefone']);
export const PLACEHOLDER_BUSCA = 'Buscar por nome, e-mail ou telefone';

/**
 * O que a busca procura, dito no placeholder: o identificador entra quando
 * é outro campo (CNPJ, código…).
 *
 * @param {ItemLayout | null | undefined} identificador
 */
export function placeholderDaBusca(identificador) {
  if (!identificador || CHAVES_SEMPRE_BUSCADAS.includes(identificador.chave)) {
    return PLACEHOLDER_BUSCA;
  }
  return `Buscar por ${identificador.label}, nome, e-mail ou telefone`;
}

/**
 * 400 do back por parte do layout: `fields.secoes.0.nome` vira `secoes`.
 * O que não for de uma parte conhecida volta em `geral`.
 *
 * @param {Record<string, string[]> | undefined} fields
 * @returns {{ porParte: Record<string, string>, geral: string[] }}
 */
export function errosPorParte(fields) {
  const porParte = {};
  const geral = [];

  for (const [chave, mensagens] of Object.entries(fields ?? {})) {
    const parte = PARTES_LAYOUT.find((nome) => chave === nome || chave.startsWith(`${nome}.`));
    const mensagem = mensagens?.[0];
    if (!mensagem) {
      continue;
    }

    if (parte) {
      porParte[parte] ??= mensagem;
    } else {
      geral.push(mensagem);
    }
  }

  return { porParte, geral };
}
