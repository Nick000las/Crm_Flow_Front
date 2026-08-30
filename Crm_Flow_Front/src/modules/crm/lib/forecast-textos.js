/**
 * @file 'AAAA-MM' → 'nov/26'. Entrada inválida volta igual.
 */
import { AGRUPAR_FORECAST, BLOCOS_FORECAST, MOTIVOS_IGNORADA, TIPOS_MES } from '../constants.js';

/** Rótulos dos blocos fora dos meses (chaves de `blocos` na resposta). */
export const ROTULOS_BLOCO = Object.freeze({
  [BLOCOS_FORECAST.ATRASADAS]: 'Atrasadas',
  [BLOCOS_FORECAST.ANTES_DO_PERIODO]: 'Antes do período',
  [BLOCOS_FORECAST.SEM_PREVISAO]: 'Sem previsão',
  [BLOCOS_FORECAST.ALEM_DO_HORIZONTE]: 'Além do horizonte',
  [BLOCOS_FORECAST.SEM_VALOR]: 'Sem valor',
});

/** Uma linha de ajuda por bloco, para o título do card. */
export const AJUDA_BLOCO = Object.freeze({
  [BLOCOS_FORECAST.ATRASADAS]: 'Abertas com data prevista antes de hoje.',
  [BLOCOS_FORECAST.ANTES_DO_PERIODO]:
    'Abertas com data prevista depois de hoje, mas antes do início do período.',
  [BLOCOS_FORECAST.SEM_PREVISAO]: 'Abertas sem data prevista.',
  [BLOCOS_FORECAST.ALEM_DO_HORIZONTE]: 'Abertas com data prevista depois do último mês do período.',
  [BLOCOS_FORECAST.SEM_VALOR]:
    'Abertas sem valor, em qualquer data. Também aparecem no bloco da data.',
});

export const ROTULOS_AGRUPAR = Object.freeze({
  [AGRUPAR_FORECAST.TOTAL]: 'Total',
  [AGRUPAR_FORECAST.RESPONSAVEL]: 'Por responsável',
  [AGRUPAR_FORECAST.STATUS]: 'Por status',
});

export const ROTULOS_TIPO_MES = Object.freeze({
  [TIPOS_MES.REALIZADO]: 'Realizado',
  [TIPOS_MES.ABERTO]: 'Em aberto',
});

/** Séries do gráfico e da tooltip (nomes dos números em `meses`). */
export const ROTULOS_SERIE = Object.freeze({
  realizado: 'Realizado',
  ponderado: 'Ponderado',
  melhorCaso: 'Melhor caso',
  previsto: 'Previsto',
  emAberto: 'Em aberto',
});

const TEXTOS_MOTIVO = Object.freeze({
  [MOTIVOS_IGNORADA.NAO_ENCONTRADA]: 'Oportunidade não encontrada.',
  [MOTIVOS_IGNORADA.NAO_ABERTA]: 'Já foi encerrada.',
  [MOTIVOS_IGNORADA.RESOURCE_CONFLICT]: 'Está arquivada.',
});

const TEXTO_MOTIVO_GENERICO = 'Não foi possível atualizar.';

/**
 * Texto de `ignoradas[].motivo`. Nunca devolve o código cru: o que não é
 * conhecido cai no texto genérico.
 * @param {string | undefined} motivo
 * @returns {string}
 */
export function textoDoMotivo(motivo) {
  return Object.hasOwn(TEXTOS_MOTIVO, motivo) ? TEXTOS_MOTIVO[motivo] : TEXTO_MOTIVO_GENERICO;
}

/** Aviso de campo desligado (`camposDesligados`), com o texto de quem pode ligar. */
const AVISOS_CAMPO_DESLIGADO = Object.freeze({
  dataPrevistaFechamento:
    'Ligue Data prevista de fechamento em Configurações → Campos para o forecast posicionar as oportunidades.',
  probabilidadeFechamento:
    'Ligue Probabilidade de fechamento em Configurações → Campos para ajustar a probabilidade de cada oportunidade. Enquanto isso, vale a probabilidade padrão do status.',
});

/**
 * Aviso de `camposDesligados`. Quem não é gestão não liga o campo sozinho:
 * o texto troca o "Ligue" por "Peça ao responsável pela conta para ligar".
 * @param {string} chave
 * @param {boolean} ehGestao
 * @returns {string | null}
 */
export function avisoDoCampoDesligado(chave, ehGestao) {
  if (!Object.hasOwn(AVISOS_CAMPO_DESLIGADO, chave)) {
    return null;
  }

  const aviso = AVISOS_CAMPO_DESLIGADO[chave];

  return ehGestao ? aviso : aviso.replace('Ligue', 'Peça ao responsável pela conta para ligar');
}

export const TEXTOS_FORECAST = Object.freeze({
  vazio: 'Ainda não há oportunidades de venda. Crie a primeira para acompanhar o forecast.',
  criarOportunidade: 'Criar oportunidade',
  semResultado: 'Nenhum resultado para estes filtros',
  titulo: 'Forecast',
  subtitulo: 'O que já foi vendido e o que se espera vender, mês a mês.',
  atualizarData: 'Atualizar data prevista',
});

/**
 * Linha sobre as ganhas sem valor (`ganhasSemValor`). Null quando não há nada a dizer.
 * @param {number} n
 * @returns {string | null}
 */
export function textoGanhasSemValor(n) {
  if (n <= 0) {
    return null;
  }

  if (n === 1) {
    return '1 venda sem valor não entra na soma';
  }

  return `${n} vendas sem valor não entram na soma`;
}

/**
 * @param {number} n
 * @returns {string}
 */
export function textoAtualizadas(n) {
  if (n === 0) {
    return 'Nenhuma atualizada';
  }

  if (n === 1) {
    return '1 atualizada';
  }

  return `${n} atualizadas`;
}

/**
 * Contador da seleção em massa, ex.: "37 de 200".
 * @param {number} n
 * @param {number} max
 * @returns {string}
 */
export function contadorSelecao(n, max) {
  return `${n} de ${max}`;
}

const MESES_COMPLETOS = Object.freeze([
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
]);

const MESES_CURTOS = Object.freeze([
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]);

/**
 * Lê `AAAA-MM` sem passar por Date (sem fuso). Null quando não é um mês válido.
 * @param {unknown} mes
 * @returns {{ ano: string, indice: number } | null}
 */
function lerMes(mes) {
  if (typeof mes !== 'string') {
    return null;
  }

  const m = /^(\d{4})-(\d{2})$/.exec(mes);

  if (!m) {
    return null;
  }

  const indice = Number(m[2]) - 1;

  if (indice < 0 || indice > 11) {
    return null;
  }

  return { ano: m[1], indice };
}

/**
 * 'AAAA-MM' → 'novembro de 2026'. Entrada inválida volta igual.
 * @param {string} mes
 * @returns {string}
 */
export function rotuloDoMes(mes) {
  const lido = lerMes(mes);

  if (!lido) {
    return mes;
  }

  return `${MESES_COMPLETOS[lido.indice]} de ${lido.ano}`;
}

/**
 * 'AAAA-MM' → 'nov/26'. Entrada inválida volta igual.
 * @param {string} mes
 * @returns {string}
 */
export function rotuloCurtoDoMes(mes) {
  const lido = lerMes(mes);

  if (!lido) {
    return mes;
  }

  return `${MESES_CURTOS[lido.indice]}/${lido.ano.slice(2)}`;
}
