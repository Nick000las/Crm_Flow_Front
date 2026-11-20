import { ROLES } from '../../../lib/roles.js';
import { toApiError } from '../../../services/api-error.js';
import {
  AGRUPAR_FORECAST,
  BLOCOS_FORECAST,
  BLOCO_NA_ROTA,
  CAMADA,
  FORECAST,
  TIPOS_MES,
} from '../constants.js';
import { ROTULOS_AGRUPAR, textoAtualizadas, textoDoMotivo } from './forecast-textos.js';
import { acessoAosDados } from './oportunidades.js';

/**
 * Forecast (FC2): a consulta da tela mora na URL. Aqui ficam a leitura e a
 * escrita dela, os params das duas rotas de leitura e as regras de quem vê o
 * quê. Nenhum número é calculado aqui: o ponderado vem pronto do back.
 *
 * @typedef {import('../api/forecast.api.js').ParamsForecast} ParamsForecast
 * @typedef {import('../api/forecast.api.js').ParamsListaForecast} ParamsListaForecast
 * @typedef {import('../api/forecast.api.js').ItemForecast} ItemForecast
 * @typedef {import('../api/forecast.api.js').ResultadoDataPrevista} ResultadoDataPrevista
 * @typedef {import('../types.js').Campo} Campo
 * @typedef {'total' | 'responsavel' | 'status'} Agrupar
 * @typedef {null | { mes: string, tipo: 'realizado' | 'aberto' } | { bloco: string }} ListaForecast
 * @typedef {{
 *   de: string | null,
 *   ate: string | null,
 *   pipelineId: string | null,
 *   responsavelId: string | null,
 *   agrupar: Agrupar,
 *   lista: ListaForecast,
 *   pagina: number,
 *   tamanho: number,
 * }} Consulta
 */

/** Nome de cada parte da consulta na URL. */
const NA_URL = Object.freeze({
  de: 'de',
  ate: 'ate',
  pipelineId: 'pipeline',
  responsavelId: 'responsavel',
  agrupar: 'agrupar',
  mes: 'mes',
  tipo: 'tipo',
  bloco: 'bloco',
  pagina: 'pagina',
  tamanho: 'tamanho',
});

/** Mudar qualquer um destes fecha a lista e volta à página 1. */
const FILTROS = Object.freeze(['de', 'ate', 'pipelineId', 'responsavelId', 'agrupar']);

/** Campos de 400 do `GET /crm/forecast` que a tela mostra como erro de filtro. */
const CAMPOS_DO_FILTRO = Object.freeze(['de', 'ate', 'agrupar', 'pipelineId', 'responsavelId']);

const VALORES_AGRUPAR = Object.freeze(Object.values(AGRUPAR_FORECAST));
const VALORES_TIPO = Object.freeze(Object.values(TIPOS_MES));
const VALORES_BLOCO = Object.freeze(Object.values(BLOCOS_FORECAST));

const CHAVE_STATUS = 'status';

export const MENSAGENS_PERIODO = Object.freeze({
  formato: 'Use o formato AAAA-MM',
  invertido: 'O mês inicial precisa vir antes do final',
  longo: `Escolha um período de até ${FORECAST.MAX_MESES} meses`,
});

/** @type {Readonly<Consulta>} */
export const CONSULTA_PADRAO = Object.freeze({
  de: null,
  ate: null,
  pipelineId: null,
  responsavelId: null,
  agrupar: AGRUPAR_FORECAST.TOTAL,
  lista: null,
  pagina: 1,
  tamanho: FORECAST.TAMANHO_PADRAO,
});

/**
 * `AAAA-MM` → número de meses desde o ano 0. Null fora do formato.
 * @param {unknown} mes
 * @returns {number | null}
 */
function indiceDoMes(mes) {
  if (typeof mes !== 'string') {
    return null;
  }
  const m = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!m) {
    return null;
  }
  const numero = Number(m[2]);
  if (numero < 1 || numero > 12) {
    return null;
  }
  return Number(m[1]) * 12 + numero - 1;
}

/** @param {unknown} mes */
const ehMes = (mes) => indiceDoMes(mes) !== null;

/** @param {string | null} texto */
const textoOuNulo = (texto) => (typeof texto === 'string' && texto.trim() ? texto.trim() : null);

/**
 * @param {Agrupar} agrupar
 * @param {string | null} pipelineId
 * @returns {Agrupar}
 */
function agruparValido(agrupar, pipelineId) {
  if (!VALORES_AGRUPAR.includes(agrupar)) {
    return AGRUPAR_FORECAST.TOTAL;
  }
  // `status` sem pipeline dá 400 no back.
  if (agrupar === AGRUPAR_FORECAST.STATUS && !pipelineId) {
    return AGRUPAR_FORECAST.TOTAL;
  }
  return agrupar;
}

/**
 * @param {string | null} mes
 * @param {string | null} tipo
 * @param {string | null} bloco
 * @returns {ListaForecast}
 */
function listaValida(mes, tipo, bloco) {
  if (mes && bloco) {
    return null;
  }
  if (mes) {
    return ehMes(mes) && VALORES_TIPO.includes(tipo) ? { mes, tipo } : null;
  }
  if (bloco) {
    return VALORES_BLOCO.includes(bloco) ? { bloco } : null;
  }
  return null;
}

/** @param {unknown} valor */
function paginaValida(valor) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero >= 1 ? numero : 1;
}

/** @param {unknown} valor */
function tamanhoValido(valor) {
  const numero = Number(valor);
  return FORECAST.TAMANHOS.includes(numero) ? numero : FORECAST.TAMANHO_PADRAO;
}

/**
 * Consulta da tela a partir da URL. O que não vale cai no padrão.
 * @param {URLSearchParams} searchParams
 * @returns {Consulta}
 */
export function lerConsulta(searchParams) {
  const ler = (parte) => textoOuNulo(searchParams.get(NA_URL[parte]));
  const de = ler('de');
  const ate = ler('ate');
  const pipelineId = ler('pipelineId');

  return {
    de: ehMes(de) ? de : null,
    ate: ehMes(ate) ? ate : null,
    pipelineId,
    responsavelId: ler('responsavelId'),
    agrupar: agruparValido(/** @type {Agrupar} */ (ler('agrupar')), pipelineId),
    lista: listaValida(ler('mes'), ler('tipo'), ler('bloco')),
    pagina: searchParams.has(NA_URL.pagina) ? paginaValida(ler('pagina')) : 1,
    tamanho: searchParams.has(NA_URL.tamanho)
      ? tamanhoValido(ler('tamanho'))
      : FORECAST.TAMANHO_PADRAO,
  };
}

/** @param {ListaForecast} a @param {ListaForecast} b */
const mesmaLista = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

/**
 * Nova URL com as mudanças. Mantém os params que não são do forecast. Mudar
 * um filtro fecha a lista e volta à página 1; abrir ou trocar a lista (ou o
 * tamanho) volta à página 1. Uma `lista`/`pagina` trazida na mesma mudança
 * vale sobre esse reinício.
 *
 * @param {URLSearchParams} searchParams
 * @param {Partial<Consulta>} mudancas
 * @returns {URLSearchParams}
 */
export function escreverConsulta(searchParams, mudancas) {
  const atual = lerConsulta(searchParams);
  const proxima = { ...atual, ...mudancas };

  const mudouFiltro = FILTROS.some(
    (chave) => Object.hasOwn(mudancas, chave) && (mudancas[chave] ?? null) !== atual[chave],
  );
  const mudouLista = Object.hasOwn(mudancas, 'lista') && !mesmaLista(mudancas.lista, atual.lista);
  const mudouTamanho = Object.hasOwn(mudancas, 'tamanho') && mudancas.tamanho !== atual.tamanho;

  // A lista e a página explícitas na mesma mudança valem (ex.: escrever a
  // consulta inteira de uma vez); senão, o filtro novo as reinicia.
  if (mudouFiltro && !Object.hasOwn(mudancas, 'lista')) {
    proxima.lista = null;
  }
  if ((mudouFiltro || mudouLista || mudouTamanho) && !Object.hasOwn(mudancas, 'pagina')) {
    proxima.pagina = 1;
  }

  const de = textoOuNulo(proxima.de);
  const ate = textoOuNulo(proxima.ate);
  const pipelineId = textoOuNulo(proxima.pipelineId);
  const responsavelId = textoOuNulo(proxima.responsavelId);
  const agrupar = agruparValido(proxima.agrupar, pipelineId);
  const lista = proxima.lista ?? null;
  const pagina = paginaValida(proxima.pagina);
  const tamanho = tamanhoValido(proxima.tamanho);

  const saida = new URLSearchParams(searchParams);
  for (const nome of Object.values(NA_URL)) {
    saida.delete(nome);
  }
  const por = (parte, valor) => {
    if (valor !== null && valor !== undefined && valor !== '') {
      saida.set(NA_URL[parte], String(valor));
    }
  };

  por('de', de);
  por('ate', ate);
  por('pipelineId', pipelineId);
  por('responsavelId', responsavelId);
  if (agrupar !== AGRUPAR_FORECAST.TOTAL) {
    por('agrupar', agrupar);
  }
  if (lista && 'mes' in lista) {
    por('mes', lista.mes);
    por('tipo', lista.tipo);
  } else if (lista && 'bloco' in lista) {
    por('bloco', lista.bloco);
  }
  if (pagina !== 1) {
    por('pagina', pagina);
  }
  if (tamanho !== FORECAST.TAMANHO_PADRAO) {
    por('tamanho', tamanho);
  }
  return saida;
}

/** @param {Record<string, unknown>} objeto */
function semVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(
      ([, valor]) => valor !== null && valor !== undefined && valor !== '',
    ),
  );
}

/**
 * Query de `GET /crm/forecast`. Sem período na URL, o back aplica o padrão.
 * @param {Consulta} consulta
 * @returns {ParamsForecast}
 */
export function paramsDoForecast(consulta) {
  return semVazios({
    de: consulta.de,
    ate: consulta.ate,
    pipelineId: consulta.pipelineId,
    responsavelId: consulta.responsavelId,
    agrupar: consulta.agrupar === AGRUPAR_FORECAST.TOTAL ? null : consulta.agrupar,
  });
}

/**
 * Query de `GET /crm/forecast/oportunidades`, com o mesmo período e os
 * mesmos filtros do GET principal. Sem período na URL, vale o `periodo`
 * efetivo da resposta (senão a lista cairia no padrão do back, que pode não
 * ser o da tela).
 *
 * @param {Consulta} consulta
 * @param {{ de: string, ate: string } | null | undefined} [periodo]
 * @returns {ParamsListaForecast | null}
 */
export function paramsDaLista(consulta, periodo) {
  const { lista } = consulta;
  if (!lista) {
    return null;
  }
  const qual =
    'mes' in lista ? { mes: lista.mes, tipo: lista.tipo } : { bloco: BLOCO_NA_ROTA[lista.bloco] };

  return semVazios({
    ...qual,
    de: consulta.de ?? periodo?.de,
    ate: consulta.ate ?? periodo?.ate,
    pipelineId: consulta.pipelineId,
    responsavelId: consulta.responsavelId,
    pagina: consulta.pagina,
    tamanho: consulta.tamanho,
  });
}

/**
 * Chave da seleção em massa: a mesma lista em outra página mantém a seleção;
 * outra lista ou outro filtro a zera.
 *
 * @param {Consulta} consulta
 * @param {{ de: string, ate: string } | null | undefined} [periodo]
 * @returns {string}
 */
export function chaveDaSelecao(consulta, periodo) {
  const params = paramsDaLista(consulta, periodo);
  if (!params) {
    return JSON.stringify(null);
  }
  const resto = { ...params };
  delete resto.pagina;
  delete resto.tamanho;
  return JSON.stringify(resto);
}

/**
 * Quantos meses de `de` a `ate`, inclusive. Null com mês inválido.
 * @param {string} de
 * @param {string} ate
 * @returns {number | null}
 */
export function mesesEntre(de, ate) {
  const inicio = indiceDoMes(de);
  const fim = indiceDoMes(ate);
  if (inicio === null || fim === null) {
    return null;
  }
  return fim - inicio + 1;
}

/**
 * Mesmas regras e mensagens do back. Vazio (null) não é erro: o back aplica o padrão.
 * @param {string | null | undefined} de
 * @param {string | null | undefined} ate
 * @returns {{ de?: string, ate?: string }}
 */
export function validarPeriodo(de, ate) {
  const erros = {};
  if (de && !ehMes(de)) {
    erros.de = MENSAGENS_PERIODO.formato;
  }
  if (ate && !ehMes(ate)) {
    erros.ate = MENSAGENS_PERIODO.formato;
  }
  if (Object.keys(erros).length > 0 || !de || !ate) {
    return erros;
  }

  const meses = mesesEntre(de, ate);
  if (meses < 1) {
    return { de: MENSAGENS_PERIODO.invertido };
  }
  if (meses > FORECAST.MAX_MESES) {
    return { ate: MENSAGENS_PERIODO.longo };
  }
  return {};
}

/**
 * Passado, atual ou futuro em relação a `hoje` (`AAAA-MM-DD` da resposta, no
 * fuso do tenant). Nunca o relógio do navegador.
 * @param {string} mes `AAAA-MM`
 * @param {string} hoje `AAAA-MM-DD`
 * @returns {'passado' | 'atual' | 'futuro'}
 */
export function tipoDoMes(mes, hoje) {
  const atual = hoje.slice(0, 7);
  if (mes === atual) {
    return 'atual';
  }
  return mes < atual ? 'passado' : 'futuro';
}

/**
 * Listas que um mês oferece: o passado só tem realizado, o futuro só aberto,
 * o atual os dois (abas).
 * @param {string} mes
 * @param {string} hoje
 * @returns {('realizado' | 'aberto')[]}
 */
export function tiposDaLista(mes, hoje) {
  const tipo = tipoDoMes(mes, hoje);
  if (tipo === 'passado') {
    return [TIPOS_MES.REALIZADO];
  }
  if (tipo === 'futuro') {
    return [TIPOS_MES.ABERTO];
  }
  return [TIPOS_MES.REALIZADO, TIPOS_MES.ABERTO];
}

/**
 * "Por status" só com pipeline e quando o papel vê Status (senão, 400).
 * @param {{ pipelineId: string | null, veStatus: boolean }} contexto
 * @returns {{ valor: Agrupar, rotulo: string }[]}
 */
export function opcoesDeAgrupar({ pipelineId, veStatus }) {
  return VALORES_AGRUPAR.filter(
    (valor) => valor !== AGRUPAR_FORECAST.STATUS || (Boolean(pipelineId) && veStatus),
  ).map((valor) => ({ valor, rotulo: ROTULOS_AGRUPAR[valor] }));
}

/**
 * O campo Status (do sistema) vem em `/fields` para o papel.
 * @param {Campo[] | null | undefined} campos
 */
export function veCampoStatus(campos) {
  return (
    Array.isArray(campos) &&
    campos.some((campo) => campo.chave === CHAVE_STATUS && campo.camada !== CAMADA.CAMADA_3)
  );
}

/**
 * Pipelines do seletor: só vendas e ativos; para o operador, sem os ocultos
 * (o back daria 404).
 * @param {import('../api/pipelines.api.js').Pipeline[] | null | undefined} pipelines
 * @param {string | null | undefined} role
 * @returns {{ valor: string, rotulo: string }[]}
 */
export function pipelinesDoForecast(pipelines, role) {
  return (pipelines ?? [])
    .filter(
      (pipeline) =>
        pipeline.ativo &&
        pipeline.tipo === 'sales' &&
        (role !== ROLES.OPERADOR || pipeline.visivelOperador !== false),
    )
    .map((pipeline) => ({ valor: pipeline.id, rotulo: pipeline.nome }));
}

/**
 * Lista de oportunidades abertas: qualquer bloco, ou um mês em aberto.
 * @param {ListaForecast} lista
 */
export function listaDeAbertas(lista) {
  if (!lista) {
    return false;
  }
  return 'bloco' in lista || lista.tipo === TIPOS_MES.ABERTO;
}

/**
 * Botão "Atualizar data prevista": só em lista de abertas e para quem edita
 * Data prevista de fechamento. Na dúvida (sem `/fields`), esconde.
 * @param {Campo[] | null | undefined} campos
 * @param {ListaForecast} lista
 */
export function podeAtualizarData(campos, lista) {
  if (!Array.isArray(campos) || !listaDeAbertas(lista)) {
    return false;
  }
  return acessoAosDados(campos).dataPrevistaFechamento?.editavel === true;
}

/**
 * Resultado da ação em massa para a tela: o nome vem dos itens já carregados
 * e o motivo é sempre texto, nunca o código.
 * @param {ResultadoDataPrevista} resposta
 * @param {ItemForecast[]} selecionados
 * @returns {{ atualizadas: number, texto: string, ignoradas: { id: string, nome: string, motivo: string }[] }}
 */
export function resumoDaAcao(resposta, selecionados) {
  const nomePorId = new Map((selecionados ?? []).map((item) => [item.id, item.pessoa]));
  const atualizadas = resposta?.atualizadas;
  const ignoradas = (resposta?.ignoradas ?? []).map((ignorada) => ({
    id: ignorada.id,
    nome: textoOuNulo(nomePorId.get(ignorada.id) ?? null) ?? 'Oportunidade',
    motivo: textoDoMotivo(ignorada.motivo),
  }));
  return { atualizadas, texto: textoAtualizadas(atualizadas), ignoradas };
}

/**
 * Erro de filtro do `GET /crm/forecast`, para a tela marcar o filtro certo.
 * Null quando o erro não é de filtro (a tela mostra o alerta genérico).
 * @param {unknown} error
 * @returns {{ tipo: 'pipeline', mensagem: string } | { tipo: 'filtro', campo: string, mensagem: string } | null}
 */
export function erroDoForecast(error) {
  if (!error) {
    return null;
  }
  const apiError = toApiError(error);
  if (apiError.status === 404 && apiError.code === 'RESOURCE_NOT_FOUND') {
    return { tipo: 'pipeline', mensagem: 'Pipeline não encontrado' };
  }
  if (apiError.status !== 400) {
    return null;
  }
  for (const campo of CAMPOS_DO_FILTRO) {
    const mensagem = apiError.fields[campo]?.[0];
    if (mensagem) {
      return { tipo: 'filtro', campo, mensagem };
    }
  }
  return null;
}
