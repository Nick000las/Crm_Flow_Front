/**
 * @file Filtros que não acharam nada (diferente de `vazio`, que é o tenant sem vendas).
 */
import { BLOCOS_FORECAST } from '../constants.js';
import {
  AJUDA_BLOCO,
  rotuloCurtoDoMes,
  rotuloDoMes,
  ROTULOS_BLOCO,
  ROTULOS_SERIE,
  textoGanhasSemValor,
} from './forecast-textos.js';
import { formatarData, formatarMoeda } from './formatadores.js';

/**
 * Montagem do que a tela do forecast mostra. Funções puras: nada é calculado
 * aqui (o ponderado vem do back) e `null` nunca vira 0 nem "R$ 0,00".
 */

const TRACO = '—';

/** @param {unknown} n */
function contagem(n) {
  return typeof n === 'number' && Number.isFinite(n) ? n : 0;
}

/**
 * Dinheiro formatado, ou `null` quando não há valor (nunca "R$ 0,00").
 * @param {number | null | undefined} valor
 * @returns {string | null}
 */
export function dinheiro(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }

  return formatarMoeda(valor);
}

/** @param {unknown} valor */
function numeroOuNulo(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) ? valor : null;
}

/** @param {number} n */
function textoOportunidades(n) {
  return n === 1 ? '1 oportunidade' : `${n} oportunidades`;
}

/**
 * @typedef {object} PontoDoGrafico
 * @property {string} mes
 * @property {string} rotulo
 * @property {string} rotuloLongo
 * @property {boolean} atual
 * @property {number | null} realizado
 * @property {number | null} emAberto
 * @property {number | null} melhorCaso
 * @property {{ rotulo: string, texto: string }[]} tooltip
 * @property {string | null} avisoSemValor
 */

/**
 * @param {import('../api/forecast.api.js').MesForecast[]} meses
 * @param {{ veValor: boolean, hoje: string }} opcoes
 * @returns {{ modo: 'valor' | 'contagem', pontos: PontoDoGrafico[] }}
 */
export function serieDoGrafico(meses, { veValor, hoje }) {
  const mesAtual = typeof hoje === 'string' ? hoje.slice(0, 7) : '';

  const pontos = meses.map((m) => {
    const base = {
      mes: m.mes,
      rotulo: rotuloCurtoDoMes(m.mes),
      rotuloLongo: rotuloDoMes(m.mes),
      atual: m.mes === mesAtual,
      avisoSemValor: textoGanhasSemValor(contagem(m.ganhasSemValor)),
    };
    const qtdRealizado = contagem(m.realizado?.quantidade);
    const qtdPonderado = contagem(m.ponderado?.quantidade);

    if (!veValor) {
      return {
        ...base,
        realizado: qtdRealizado,
        emAberto: qtdPonderado,
        melhorCaso: null,
        tooltip: [
          { rotulo: ROTULOS_SERIE.realizado, texto: textoOportunidades(qtdRealizado) },
          { rotulo: ROTULOS_SERIE.emAberto, texto: textoOportunidades(qtdPonderado) },
        ],
      };
    }

    const realizado = numeroOuNulo(m.realizado?.soma);
    const emAberto = numeroOuNulo(m.ponderado?.soma);
    const melhorCaso = numeroOuNulo(m.melhorCaso?.soma);

    return {
      ...base,
      realizado,
      emAberto,
      melhorCaso,
      tooltip: [
        {
          rotulo: ROTULOS_SERIE.realizado,
          texto: `${dinheiro(realizado) ?? TRACO} · ${qtdRealizado}`,
        },
        {
          rotulo: ROTULOS_SERIE.ponderado,
          texto: `${dinheiro(emAberto) ?? TRACO} · ${qtdPonderado}`,
        },
        { rotulo: ROTULOS_SERIE.melhorCaso, texto: dinheiro(melhorCaso) ?? TRACO },
        { rotulo: ROTULOS_SERIE.previsto, texto: dinheiro(numeroOuNulo(m.previsto)) ?? TRACO },
      ],
    };
  });

  return { modo: veValor ? 'valor' : 'contagem', pontos };
}

const ORDEM_CARDS = [
  BLOCOS_FORECAST.ATRASADAS,
  BLOCOS_FORECAST.SEM_PREVISAO,
  BLOCOS_FORECAST.ANTES_DO_PERIODO,
  BLOCOS_FORECAST.ALEM_DO_HORIZONTE,
  BLOCOS_FORECAST.SEM_VALOR,
];

const BLOCOS_DE_ALERTA = new Set([BLOCOS_FORECAST.ATRASADAS, BLOCOS_FORECAST.SEM_PREVISAO]);

/**
 * @typedef {object} CardDoBloco
 * @property {string} chave
 * @property {string} rotulo
 * @property {string} ajuda
 * @property {boolean} alerta
 * @property {number} quantidade
 * @property {string | null} soma
 * @property {string | null} ponderado
 * @property {boolean} clicavel
 */

/**
 * @param {import('../api/forecast.api.js').BlocosForecast} blocos
 * @param {boolean} veValor
 * @returns {CardDoBloco[]}
 */
export function cardsDosBlocos(blocos, veValor) {
  const cards = [];

  for (const chave of ORDEM_CARDS) {
    const bloco = blocos?.[chave];
    const quantidade = contagem(bloco?.quantidade);

    if (chave === BLOCOS_FORECAST.ANTES_DO_PERIODO && quantidade <= 0) {
      continue;
    }

    const comValor = veValor && chave !== BLOCOS_FORECAST.SEM_VALOR;

    cards.push({
      chave,
      rotulo: ROTULOS_BLOCO[chave],
      ajuda: AJUDA_BLOCO[chave],
      alerta: BLOCOS_DE_ALERTA.has(chave),
      quantidade,
      soma: comValor ? dinheiro(bloco?.soma) : null,
      ponderado: comValor ? dinheiro(bloco?.ponderado) : null,
      clicavel: quantidade > 0,
    });
  }

  return cards;
}

/**
 * @typedef {object} ColunaForecast
 * @property {string} id
 * @property {string} rotulo
 * @property {string | null} chave Chave do item da API que a coluna exige (`null` = sempre).
 * @property {boolean} numerica
 */

export const COLUNAS_FORECAST = Object.freeze([
  { id: 'pessoa', rotulo: 'Pessoa', chave: null, numerica: false },
  { id: 'status', rotulo: 'Status', chave: 'statusLabel', numerica: false },
  { id: 'valor', rotulo: 'Valor', chave: 'valor', numerica: true },
  { id: 'probabilidade', rotulo: 'Probabilidade', chave: 'probabilidadeEfetiva', numerica: true },
  { id: 'ponderado', rotulo: 'Ponderado', chave: 'ponderado', numerica: true },
  { id: 'dataPrevista', rotulo: 'Data prevista', chave: 'dataPrevistaFechamento', numerica: true },
  { id: 'ganhaEm', rotulo: 'Ganha em', chave: 'ganhaEm', numerica: true },
  { id: 'responsavel', rotulo: 'Responsável', chave: null, numerica: false },
]);

/**
 * Colunas da lista. A chave que o papel não vê nem vem no item: a coluna só
 * some quando a chave não existe em nenhum item.
 * @param {object[]} itens
 * @returns {ColunaForecast[]}
 */
export function colunasDaLista(itens) {
  return COLUNAS_FORECAST.filter((coluna) => {
    if (coluna.chave === null) {
      return true;
    }

    const presente = itens.some((item) => coluna.chave in item);

    if (!presente) {
      return false;
    }

    if (coluna.id === 'ganhaEm') {
      return itens.some((item) => item.ganhaEm !== null && item.ganhaEm !== undefined);
    }

    return true;
  });
}

/**
 * Texto de uma célula, ou `null` (o componente mostra "—").
 * @param {object} item
 * @param {ColunaForecast | string} coluna
 * @param {Map<string, string>} nomePorId
 * @returns {string | null}
 */
export function celulaDaLista(item, coluna, nomePorId) {
  const id = typeof coluna === 'string' ? coluna : coluna.id;

  switch (id) {
    case 'pessoa':
      return item.pessoa ?? null;
    case 'status':
      return item.statusLabel ?? null;
    case 'valor':
      return dinheiro(item.valor);
    case 'ponderado':
      return dinheiro(item.ponderado);
    case 'probabilidade': {
      const n = numeroOuNulo(item.probabilidadeEfetiva);

      return n === null ? null : `${n}%`;
    }

    case 'dataPrevista':
      return formatarData(item.dataPrevistaFechamento);
    case 'ganhaEm':
      return formatarData(item.ganhaEm);
    case 'responsavel': {
      const respId = item.responsavelId;

      if (respId === null || respId === undefined) {
        return 'Sem responsável';
      }

      return nomePorId.get(respId) ?? String(respId).slice(0, 8);
    }

    default:
      return null;
  }
}

/**
 * @typedef {object} LinhaDeGrupo
 * @property {string | null} chave
 * @property {string} rotulo
 * @property {string | null} previsto
 * @property {number} quantidade Oportunidades dos meses (realizado + ponderado).
 * @property {{ mes: string, texto: string | null }[]} meses
 */

/**
 * @param {import('../api/forecast.api.js').GrupoForecast[]} grupos
 * @param {boolean} veValor
 * @returns {LinhaDeGrupo[]}
 */
export function linhasDosGrupos(grupos, veValor) {
  return grupos.map((grupo) => {
    let quantidade = 0;
    const meses = grupo.meses.map((m) => {
      const qtd = contagem(m.realizado?.quantidade) + contagem(m.ponderado?.quantidade);

      quantidade += qtd;

      return { mes: m.mes, texto: veValor ? dinheiro(numeroOuNulo(m.previsto)) : String(qtd) };
    });

    let previsto = null;

    if (veValor) {
      const valores = grupo.meses.map((m) => numeroOuNulo(m.previsto));

      if (valores.every((v) => v !== null)) {
        previsto = dinheiro(valores.reduce((total, v) => total + v, 0));
      }
    }

    return { chave: grupo.chave, rotulo: grupo.rotulo, previsto, quantidade, meses };
  });
}

/**
 * Filtros que não acharam nada (diferente de `vazio`, que é o tenant sem vendas).
 * @param {import('../api/forecast.api.js').RespostaForecast} resposta
 * @returns {boolean}
 */
export function semResultado(resposta) {
  if (resposta.vazio) {
    return false;
  }

  const meses = resposta.meses.every(
    (m) => contagem(m.realizado?.quantidade) === 0 && contagem(m.ponderado?.quantidade) === 0,
  );
  const blocos = Object.values(resposta.blocos ?? {}).every(
    (bloco) => contagem(bloco?.quantidade) === 0,
  );

  return meses && blocos;
}
