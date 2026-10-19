import { BUSCA_LEADS, OPERADORES_POR_TIPO, TIPOS_CAMPO } from '../constants.js';
import { lerNumeroDigitado } from './form-lead.js';
import {
  formatarCep,
  formatarCnpj,
  formatarCpf,
  formatarData,
  formatarMoeda,
  formatarNumero,
} from './formatadores.js';
import { rotuloOpcao } from './opcoes.js';

/**
 * Três formas do mesmo filtro:
 * - **aplicado**: o contrato de `POST /crm/leads/search` (sem `busca`, que
 *   mora à parte) — é o que vai na URL e nas views;
 * - **rascunho**: o que o construtor edita, só com strings/listas, até o
 *   "Aplicar" (cada aplicação é uma busca, então não se aplica por tecla);
 * - **chips**: a descrição legível do aplicado.
 *
 * @typedef {import('../types.js').FiltroCampo} FiltroCampo
 * @typedef {{
 *   filtros: FiltroCampo[],
 *   usuarioResponsavelId?: string,
 *   valorMin?: number,
 *   valorMax?: number,
 *   criadoDe?: string,
 *   criadoAte?: string,
 *   esfriando?: true,
 *   semResponsavel?: true,
 * }} FiltroAplicado   datas em `AAAA-MM-DD`; `esfriando` exige `crm.inatividade`;
 *   `semResponsavel` (sem dono ou dono desativado) exclui `usuarioResponsavelId`
 * @typedef {{ id: string, chave: string, operador: string, valor: unknown }} LinhaFiltro
 * @typedef {{
 *   usuarioResponsavelId: string,   `RESPONSAVEL_NENHUM` = sem responsável
 *   valorMin: string,
 *   valorMax: string,
 *   criadoDe: string,
 *   criadoAte: string,
 *   esfriando: boolean,
 * }} FixosRascunho   `esfriando` não tem controle no construtor (vem da view
 *   ou da notificação); só atravessa o rascunho para "Aplicar" não perdê-lo
 * @typedef {{ linhas: LinhaFiltro[], fixos: FixosRascunho }} Rascunho
 */

export const OPERADOR = Object.freeze({
  IGUAL: 'igual',
  CONTEM: 'contem',
  ENTRE: 'entre',
  E_UM_DOS: 'e_um_dos',
  VAZIO: 'vazio',
  NAO_VAZIO: 'nao_vazio',
});

export const ROTULOS_OPERADOR = Object.freeze({
  [OPERADOR.IGUAL]: 'é',
  [OPERADOR.CONTEM]: 'contém',
  [OPERADOR.ENTRE]: 'entre',
  [OPERADOR.E_UM_DOS]: 'é um de',
  [OPERADOR.VAZIO]: 'está vazio',
  [OPERADOR.NAO_VAZIO]: 'está preenchido',
});

export const MENSAGENS_FILTRO = Object.freeze({
  VALOR: 'Informe um valor',
  NUMERO: 'Informe um número válido',
  LIMITE: 'Informe ao menos um limite',
  LISTA: 'Escolha ao menos um valor',
});

const OPERADORES_VALIDOS = new Set(Object.values(OPERADOR));
const SEM_VALOR = new Set([OPERADOR.VAZIO, OPERADOR.NAO_VAZIO]);
const DATA = /^\d{4}-\d{2}-\d{2}$/;
const PREFIXO_ERRO = 'filtros.';
const TAMANHO_ID_CURTO = 8;

/**
 * Valor do select "Responsável" no rascunho para "Sem responsável": um select
 * só para os dois filtros, então não dá para combiná-los (o back daria 400).
 */
export const RESPONSAVEL_NENHUM = 'sem-responsavel';

/** @type {FiltroAplicado} */
export const FILTRO_VAZIO = Object.freeze({ filtros: Object.freeze([]) });

/** @type {FixosRascunho} */
const FIXOS_VAZIOS = Object.freeze({
  usuarioResponsavelId: '',
  valorMin: '',
  valorMax: '',
  criadoDe: '',
  criadoAte: '',
  esfriando: false,
});

let proximoIdLinha = 0;
const gerarIdLinha = () => `linha-${(proximoIdLinha += 1)}`;

// ---------------------------------------------------------------------------
// Aplicado: contagem, URL e corpo da busca

/** Quantos filtros ativos — o número no botão "Filtros (n)". */
export function contarFiltros(filtro) {
  return (
    filtro.filtros.length +
    (filtro.usuarioResponsavelId || filtro.semResponsavel ? 1 : 0) +
    (filtro.valorMin !== undefined || filtro.valorMax !== undefined ? 1 : 0) +
    (filtro.criadoDe || filtro.criadoAte ? 1 : 0) +
    (filtro.esfriando ? 1 : 0)
  );
}

/** JSON compacto para a URL; `null` quando não há filtro (o parâmetro some). */
export function serializarFiltro(filtro) {
  return contarFiltros(filtro) === 0 ? null : JSON.stringify(filtro);
}

const numeroFinito = (valor) => (Number.isFinite(valor) ? valor : undefined);
const dataValida = (valor) => (typeof valor === 'string' && DATA.test(valor) ? valor : undefined);

/**
 * Lê o filtro da URL ou de uma view salva. Tudo que não tem a forma certa é
 * descartado — o link pode ter sido editado à mão. A compatibilidade de
 * valor com o campo continua sendo do back.
 *
 * @param {unknown} entrada string JSON (URL) ou objeto (view)
 * @returns {FiltroAplicado}
 */
export function lerFiltro(entrada) {
  let bruto = entrada;

  if (typeof entrada === 'string') {
    try {
      bruto = JSON.parse(entrada);
    } catch {
      return FILTRO_VAZIO;
    }
  }
  if (!bruto || typeof bruto !== 'object') return FILTRO_VAZIO;

  const filtros = (Array.isArray(bruto.filtros) ? bruto.filtros : [])
    .filter((item) => typeof item?.chave === 'string' && OPERADORES_VALIDOS.has(item.operador))
    .slice(0, BUSCA_LEADS.MAX_FILTROS)
    .map(({ chave, operador, valor }) =>
      SEM_VALOR.has(operador) ? { chave, operador } : { chave, operador, valor },
    );

  const usuarioResponsavelId =
    typeof bruto.usuarioResponsavelId === 'string' && bruto.usuarioResponsavelId
      ? bruto.usuarioResponsavelId
      : undefined;

  return omitirIndefinidos({
    filtros,
    usuarioResponsavelId,
    valorMin: numeroFinito(bruto.valorMin),
    valorMax: numeroFinito(bruto.valorMax),
    criadoDe: dataValida(bruto.criadoDe),
    criadoAte: dataValida(bruto.criadoAte),
    // Só `true` conta: `false` é o mesmo que não filtrar.
    esfriando: bruto.esfriando === true ? true : undefined,
    // Os dois juntos dão 400: num link editado à mão, vale o responsável.
    semResponsavel: bruto.semResponsavel === true && !usuarioResponsavelId ? true : undefined,
  });
}

/**
 * Filtro aplicado → campos do corpo da busca. `criadoAte` é um dia inteiro:
 * vira o último instante do dia, senão o próprio dia ficaria de fora.
 *
 * @param {FiltroAplicado} filtro
 */
export function paraCorpoDeBusca(filtro) {
  return omitirIndefinidos({
    ...filtro,
    criadoAte: filtro.criadoAte ? `${filtro.criadoAte}T23:59:59.999` : undefined,
  });
}

function omitirIndefinidos(objeto) {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined));
}

// ---------------------------------------------------------------------------
// Rascunho: linhas do construtor

/**
 * Família de input do tipo no construtor: monetário edita como número; texto
 * longo, telefone, e-mail, URL, documentos e endereço, como texto; período,
 * como data (de/até). Os operadores continuam sendo os do tipo real
 * (`OPERADORES_POR_TIPO`).
 *
 * @param {import('../types.js').TipoCampo} tipo
 */
export function tipoBase(tipo) {
  return TIPO_BASE[tipo] ?? tipo;
}

const TIPO_BASE = Object.freeze({
  [TIPOS_CAMPO.MONETARIO]: TIPOS_CAMPO.NUMERO,
  [TIPOS_CAMPO.TEXTO_LONGO]: TIPOS_CAMPO.TEXTO,
  [TIPOS_CAMPO.TELEFONE]: TIPOS_CAMPO.TEXTO,
  [TIPOS_CAMPO.EMAIL]: TIPOS_CAMPO.TEXTO,
  [TIPOS_CAMPO.URL]: TIPOS_CAMPO.TEXTO,
  [TIPOS_CAMPO.CPF]: TIPOS_CAMPO.TEXTO,
  [TIPOS_CAMPO.CNPJ]: TIPOS_CAMPO.TEXTO,
  [TIPOS_CAMPO.CEP]: TIPOS_CAMPO.TEXTO,
  [TIPOS_CAMPO.ENDERECO]: TIPOS_CAMPO.TEXTO,
  // `entre` no período = sobreposição com o de/até do filtro.
  [TIPOS_CAMPO.INTERVALO_DATAS]: TIPOS_CAMPO.DATA,
});

/** Máscara do valor no chip, para documento digitado sem pontuação. */
const MASCARA_NO_CHIP = Object.freeze({
  [TIPOS_CAMPO.CPF]: formatarCpf,
  [TIPOS_CAMPO.CNPJ]: formatarCnpj,
  [TIPOS_CAMPO.CEP]: formatarCep,
});

const ehNumerico = (campo) => Boolean(campo) && tipoBase(campo.tipo) === TIPOS_CAMPO.NUMERO;

/** @param {import('../types.js').Campo} campo */
export function operadoresDoCampo(campo) {
  return OPERADORES_POR_TIPO[campo.tipo] ?? [];
}

export function operadorSemValor(operador) {
  return SEM_VALOR.has(operador);
}

/** Valor vazio no formato que o controle do operador edita. */
export function valorVazio(operador, campo) {
  if (SEM_VALOR.has(operador)) return null;
  if (operador === OPERADOR.ENTRE) return { de: '', ate: '' };
  if (operador === OPERADOR.E_UM_DOS) return [];
  if (campo?.tipo === TIPOS_CAMPO.BOOLEANO) return 'true';

  return '';
}

/** @param {import('../types.js').Campo} campo @returns {LinhaFiltro} */
export function novaLinha(campo) {
  const [operador] = operadoresDoCampo(campo);

  return { id: gerarIdLinha(), chave: campo.chave, operador, valor: valorVazio(operador, campo) };
}

/** Trocar o campo reinicia operador e valor: o tipo pode ter mudado. */
export function trocarCampo(linha, campo) {
  return { ...novaLinha(campo), id: linha.id };
}

/** Trocar o operador limpa o valor só quando o formato dele muda. */
export function trocarOperador(linha, operador, campo) {
  const formatoAntes = JSON.stringify(valorVazio(linha.operador, campo));
  const formatoDepois = JSON.stringify(valorVazio(operador, campo));
  const mesmoFormato = formatoAntes === formatoDepois;

  return { ...linha, operador, valor: mesmoFormato ? linha.valor : valorVazio(operador, campo) };
}

const numeroParaTexto = (valor) => (typeof valor === 'number' ? String(valor).replace('.', ',') : '');

/** Item aplicado → linha editável (também a condição de uma regra de campo). */
export function linhaDoItem(item, campo) {
  const base = { id: gerarIdLinha(), chave: item.chave, operador: item.operador };
  const numerico = ehNumerico(campo);

  if (SEM_VALOR.has(item.operador)) return { ...base, valor: null };
  if (item.operador === OPERADOR.ENTRE) {
    const faixa = item.valor ?? {};
    const converter = numerico ? numeroParaTexto : (valor) => valor ?? '';
    return { ...base, valor: { de: converter(faixa.de), ate: converter(faixa.ate) } };
  }
  if (item.operador === OPERADOR.E_UM_DOS) {
    return { ...base, valor: Array.isArray(item.valor) ? item.valor : [] };
  }
  if (numerico) return { ...base, valor: numeroParaTexto(item.valor) };

  return { ...base, valor: item.valor === undefined || item.valor === null ? '' : String(item.valor) };
}

/**
 * @param {FiltroAplicado} filtro
 * @param {import('../types.js').Campo[]} campos
 * @returns {Rascunho}
 */
export function rascunhoDoFiltro(filtro, campos) {
  const campoPorChave = new Map(campos.map((campo) => [campo.chave, campo]));

  return {
    linhas: filtro.filtros.map((item) => linhaDoItem(item, campoPorChave.get(item.chave))),
    fixos: {
      usuarioResponsavelId: filtro.semResponsavel ? RESPONSAVEL_NENHUM : (filtro.usuarioResponsavelId ?? ''),
      valorMin: numeroParaTexto(filtro.valorMin),
      valorMax: numeroParaTexto(filtro.valorMax),
      criadoDe: filtro.criadoDe ?? '',
      criadoAte: filtro.criadoAte ?? '',
      esfriando: Boolean(filtro.esfriando),
    },
  };
}

export function rascunhoVazio() {
  return { linhas: [], fixos: { ...FIXOS_VAZIOS } };
}

/** Converte um limite de faixa; `undefined` = sem limite, `NaN` = inválido. */
function lerLimite(texto, numerico) {
  if (texto === '' || texto === null || texto === undefined) return undefined;
  if (!numerico) return String(texto);

  return lerNumeroDigitado(texto) ?? undefined;
}

/**
 * Linha → item do contrato, ou a mensagem do que falta. Também converte a
 * condição de uma regra de campo (mesmos operadores e valores).
 *
 * @returns {{ item: FiltroCampo } | { erro: string }}
 */
export function itemDaLinha(linha, campo) {
  const { chave, operador, valor } = linha;
  const numerico = ehNumerico(campo);

  if (SEM_VALOR.has(operador)) return { item: { chave, operador } };

  if (operador === OPERADOR.ENTRE) {
    const de = lerLimite(valor?.de, numerico);
    const ate = lerLimite(valor?.ate, numerico);
    if (Number.isNaN(de) || Number.isNaN(ate)) return { erro: MENSAGENS_FILTRO.NUMERO };
    if (de === undefined && ate === undefined) return { erro: MENSAGENS_FILTRO.LIMITE };
    return { item: { chave, operador, valor: omitirIndefinidos({ de, ate }) } };
  }

  if (operador === OPERADOR.E_UM_DOS) {
    return Array.isArray(valor) && valor.length > 0
      ? { item: { chave, operador, valor } }
      : { erro: MENSAGENS_FILTRO.LISTA };
  }

  if (numerico) {
    const numero = lerNumeroDigitado(valor ?? '');
    if (numero === null) return { erro: MENSAGENS_FILTRO.VALOR };
    if (Number.isNaN(numero)) return { erro: MENSAGENS_FILTRO.NUMERO };
    return { item: { chave, operador, valor: numero } };
  }

  if (campo.tipo === TIPOS_CAMPO.BOOLEANO) {
    return { item: { chave, operador, valor: valor === 'true' } };
  }

  const texto = String(valor ?? '').trim();
  return texto ? { item: { chave, operador, valor: texto } } : { erro: MENSAGENS_FILTRO.VALOR };
}

/**
 * Rascunho → filtro aplicado. Com qualquer erro, nada é aplicado: devolve
 * os erros por id de linha (ou nome do fixo) para o construtor destacar.
 *
 * @param {Rascunho} rascunho
 * @param {import('../types.js').Campo[]} campos
 * @returns {{ filtro: FiltroAplicado } | { erros: Record<string, string> }}
 */
export function filtroDoRascunho({ linhas, fixos }, campos) {
  const campoPorChave = new Map(campos.map((campo) => [campo.chave, campo]));
  const erros = {};
  const filtros = [];

  for (const linha of linhas) {
    const campo = campoPorChave.get(linha.chave);
    // Campo que deixou de existir (desligado depois de salvo) sai em silêncio.
    if (!campo) continue;

    const resultado = itemDaLinha(linha, campo);
    if ('erro' in resultado) erros[linha.id] = resultado.erro;
    else filtros.push(resultado.item);
  }

  const valorMin = lerLimite(fixos.valorMin, true);
  const valorMax = lerLimite(fixos.valorMax, true);
  if (Number.isNaN(valorMin)) erros.valorMin = MENSAGENS_FILTRO.NUMERO;
  if (Number.isNaN(valorMax)) erros.valorMax = MENSAGENS_FILTRO.NUMERO;

  if (Object.keys(erros).length > 0) return { erros };

  return {
    filtro: lerFiltro({
      filtros,
      usuarioResponsavelId:
        fixos.usuarioResponsavelId && fixos.usuarioResponsavelId !== RESPONSAVEL_NENHUM
          ? fixos.usuarioResponsavelId
          : undefined,
      semResponsavel: fixos.usuarioResponsavelId === RESPONSAVEL_NENHUM || undefined,
      valorMin,
      valorMax,
      criadoDe: fixos.criadoDe || undefined,
      criadoAte: fixos.criadoAte || undefined,
      esfriando: fixos.esfriando || undefined,
    }),
  };
}

// ---------------------------------------------------------------------------
// Chips e erros do back

/** `de X a Y`, `a partir de X`, `até Y`. */
function descreverFaixa(de, ate, formatar) {
  const temDe = de !== undefined && de !== null && de !== '';
  const temAte = ate !== undefined && ate !== null && ate !== '';

  if (temDe && temAte) return `de ${formatar(de)} a ${formatar(ate)}`;
  if (temDe) return `a partir de ${formatar(de)}`;
  return `até ${formatar(ate)}`;
}

function formatadorDoCampo(campo, nomePorId) {
  if (campo?.tipo === TIPOS_CAMPO.MONETARIO) return (valor) => formatarMoeda(valor) ?? String(valor);
  if (ehNumerico(campo)) return (valor) => formatarNumero(valor) ?? String(valor);
  if (campo && tipoBase(campo.tipo) === TIPOS_CAMPO.DATA) return (valor) => formatarData(valor) ?? String(valor);
  if (campo?.tipo === TIPOS_CAMPO.USUARIO) {
    return (valor) => nomePorId?.get(String(valor)) ?? String(valor).slice(0, TAMANHO_ID_CURTO);
  }
  if (MASCARA_NO_CHIP[campo?.tipo]) return (valor) => MASCARA_NO_CHIP[campo.tipo](valor) ?? String(valor);
  if (campo?.tipo === TIPOS_CAMPO.BOOLEANO) return (valor) => (valor ? 'Sim' : 'Não');
  if (campo?.tipo === TIPOS_CAMPO.SELECAO || campo?.tipo === TIPOS_CAMPO.SELECAO_MULTIPLA) {
    return (valor) => rotuloOpcao(valor, campo);
  }
  return (valor) => String(valor);
}

/**
 * "Status é um de Novo, Ganho", "Renda de 1.000 a 5.000".
 *
 * @param {FiltroCampo} item
 * @param {import('../types.js').Campo | undefined} campo ausente se foi desligado
 * @param {Map<string, string>} [nomePorId] nome do usuário (tipo `usuario`)
 */
export function descreverItem(item, campo, nomePorId) {
  const label = campo?.label ?? item.chave;
  const operador = ROTULOS_OPERADOR[item.operador];
  const formatar = formatadorDoCampo(campo, nomePorId);

  if (SEM_VALOR.has(item.operador)) return `${label} ${operador}`;
  if (item.operador === OPERADOR.ENTRE) {
    return `${label} ${descreverFaixa(item.valor?.de, item.valor?.ate, formatar)}`;
  }
  if (Array.isArray(item.valor)) return `${label} ${operador} ${item.valor.map(formatar).join(', ')}`;

  return `${label} ${operador} ${formatar(item.valor)}`;
}

/**
 * Chips do filtro aplicado. Cada um sabe se remover (devolve o filtro sem
 * ele) e qual `chave` o back usaria para apontar erro nele.
 *
 * @param {FiltroAplicado} filtro
 * @param {import('../types.js').Campo[]} campos
 * @param {Map<string, string>} nomePorId
 * @returns {{ id: string, texto: string, chave?: string, remover: () => FiltroAplicado }[]}
 */
export function chipsDoFiltro(filtro, campos, nomePorId) {
  const campoPorChave = new Map(campos.map((campo) => [campo.chave, campo]));
  const sem = (...chaves) => () =>
    lerFiltro(Object.fromEntries(Object.entries(filtro).filter(([chave]) => !chaves.includes(chave))));

  const chips = filtro.filtros.map((item, indice) => ({
    id: `filtro-${indice}`,
    texto: descreverItem(item, campoPorChave.get(item.chave), nomePorId),
    chave: item.chave,
    remover: () => ({ ...filtro, filtros: filtro.filtros.filter((_, atual) => atual !== indice) }),
  }));

  if (filtro.usuarioResponsavelId) {
    const id = filtro.usuarioResponsavelId;
    chips.push({
      id: 'responsavel',
      texto: `Responsável é ${nomePorId.get(id) ?? id.slice(0, TAMANHO_ID_CURTO)}`,
      remover: sem('usuarioResponsavelId'),
    });
  }
  if (filtro.semResponsavel) {
    chips.push({ id: 'sem-responsavel', texto: 'Sem responsável', remover: sem('semResponsavel') });
  }
  if (filtro.valorMin !== undefined || filtro.valorMax !== undefined) {
    chips.push({
      id: 'valor',
      texto: `Valor ${descreverFaixa(filtro.valorMin, filtro.valorMax, formatarMoeda)}`,
      remover: sem('valorMin', 'valorMax'),
    });
  }
  if (filtro.criadoDe || filtro.criadoAte) {
    chips.push({
      id: 'criado',
      texto: `Criado ${descreverFaixa(filtro.criadoDe, filtro.criadoAte, formatarData)}`,
      remover: sem('criadoDe', 'criadoAte'),
    });
  }
  if (filtro.esfriando) {
    chips.push({ id: 'esfriando', texto: 'Esfriando', remover: sem('esfriando') });
  }

  return chips;
}

/**
 * Chaves de campo que o back apontou num 400 de filtro
 * (`fields['filtros.<chave>']`), para destacar a linha e o chip.
 *
 * @param {Record<string, string[]> | undefined} fields
 */
export function chavesComErro(fields) {
  return new Set(
    Object.keys(fields ?? {})
      .filter((chave) => chave.startsWith(PREFIXO_ERRO))
      .map((chave) => chave.slice(PREFIXO_ERRO.length)),
  );
}
