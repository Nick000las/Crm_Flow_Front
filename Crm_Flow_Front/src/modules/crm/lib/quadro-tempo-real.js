/**
 * @file Tira o que saiu e põe o que está nesta coluna. Fora da ordem por atualização, o card
 * fica onde estava (ou no topo, se chegou agora) até a recarga da coluna.
 */
import { porNoTopo, tirarDasPaginas } from './quadro.js';
import { DIRECAO, ORDEM_PADRAO } from './quadro-consulta.js';

/**
 * Tempo real do quadro comercial (M5): o aviso traz só ids, e a tela relê os
 * cards com o filtro dela. Aqui, o que fazer com a releitura.
 *
 * @typedef {import('../api/quadro.api.js').CardQuadro} CardQuadro
 * @typedef {import('../api/quadro.api.js').ReleituraDeCards} ReleituraDeCards
 * @typedef {import('./quadro.js').PaginasDaColuna} PaginasDaColuna
 * @typedef {import('./quadro-consulta.js').OrdemDoQuadro} OrdemDoQuadro
 */

/** Máximo de ids por chamada de `/cards/por-ids`. */
export const LIMITE_DE_IDS = 100;

/**
 * @param {string[]} ids
 * @returns {string[][]}
 */
export function lotesDeIds(ids) {
  const lotes = [];

  for (let inicio = 0; inicio < ids.length; inicio += LIMITE_DE_IDS) {
    lotes.push(ids.slice(inicio, inicio + LIMITE_DE_IDS));
  }

  return lotes;
}

/**
 * O card só traz o `atualizadoEm`: nas outras ordens, a tela não sabe o lugar
 * dele, e quem resolve é a recarga da coluna.
 *
 * @param {OrdemDoQuadro} [ordem] ausente = a padrão
 */
export function ordenaPorAtualizacao(ordem = ORDEM_PADRAO) {
  return ordem.campo === ORDEM_PADRAO.campo;
}

/**
 * @param {PaginasDaColuna | undefined} dados
 * @param {string} entidadeId
 */
function temCard(dados, entidadeId) {
  return Boolean(
    dados?.pages.some((pagina) => pagina.itens.some((card) => card.entidadeId === entidadeId)),
  );
}

/**
 * Colunas cujo total pode ter mudado. `desconhecido`: um id não estava em nada
 * carregado (pode estar além da página), então a origem não se sabe.
 *
 * @param {Map<string, PaginasDaColuna | undefined>} dadosPorColuna
 * @param {ReleituraDeCards} releitura
 * @returns {{ colunas: Set<string>, desconhecido: boolean }}
 */
export function colunasAfetadas(dadosPorColuna, { itens, ausentes }) {
  const colunas = new Set(itens.map((card) => card.colunaRef));
  let desconhecido = false;

  for (const id of [...itens.map((card) => card.entidadeId), ...ausentes]) {
    const origens = [...dadosPorColuna]
      .filter(([, dados]) => temCard(dados, id))
      .map(([colunaRef]) => colunaRef);

    origens.forEach((colunaRef) => colunas.add(colunaRef));
    desconhecido ||= origens.length === 0;
  }

  return { colunas, desconhecido };
}

/**
 * @param {PaginasDaColuna} dados
 * @param {CardQuadro} card
 */
function trocarNasPaginas(dados, card) {
  return {
    ...dados,
    pages: dados.pages.map((pagina) => ({
      ...pagina,
      itens: pagina.itens.map((atual) => (atual.entidadeId === card.entidadeId ? card : atual)),
    })),
  };
}

/**
 * Pelo `atualizadoEm`. Depois do fim, com outra página por vir, o card fica de
 * fora: ele chega no "Carregar mais".
 *
 * @param {PaginasDaColuna} dados
 * @param {CardQuadro} card
 * @param {'asc' | 'desc'} direcao
 */
function inserirNaOrdem(dados, card, direcao) {
  const instante = Date.parse(card.atualizadoEm);
  const vemDepois = (outro) => {
    const doOutro = Date.parse(outro.atualizadoEm);

    return direcao === DIRECAO.DESC ? doOutro <= instante : doOutro >= instante;
  };
  const indicePagina = dados.pages.findIndex((pagina) => pagina.itens.some(vemDepois));
  const ultima = dados.pages.length - 1;

  if (indicePagina === -1 && (ultima < 0 || dados.pages[ultima].proximoCursor)) {
    return dados;
  }

  const alvo = indicePagina === -1 ? ultima : indicePagina;

  return {
    ...dados,
    pages: dados.pages.map((pagina, indice) => {
      if (indice !== alvo) {
        return pagina;
      }

      const posicao = pagina.itens.findIndex(vemDepois);
      const corte = posicao === -1 ? pagina.itens.length : posicao;

      return {
        ...pagina,
        itens: [...pagina.itens.slice(0, corte), card, ...pagina.itens.slice(corte)],
      };
    }),
  };
}

/**
 * Tira o que saiu e põe o que está nesta coluna. Fora da ordem por atualização,
 * o card fica onde estava (ou no topo, se chegou agora) até a recarga da coluna.
 *
 * @param {PaginasDaColuna | undefined} dados `undefined` = coluna que ainda não carregou
 * @param {string} colunaRef
 * @param {ReleituraDeCards} releitura
 * @param {OrdemDoQuadro} [ordem]
 * @returns {PaginasDaColuna | undefined}
 */
export function aplicarNaColuna(dados, colunaRef, { itens, ausentes }, ordem = ORDEM_PADRAO) {
  if (!dados) {
    return dados;
  }

  const daqui = itens.filter((card) => card.colunaRef === colunaRef);
  const sairam = [
    ...ausentes,
    ...itens.filter((card) => card.colunaRef !== colunaRef).map((card) => card.entidadeId),
  ];
  const restantes = sairam.reduce((atual, id) => tirarDasPaginas(atual, id), dados);

  if (ordenaPorAtualizacao(ordem)) {
    return daqui.reduce(
      (atual, card) => inserirNaOrdem(tirarDasPaginas(atual, card.entidadeId), card, ordem.direcao),
      restantes,
    );
  }

  return daqui.reduce(
    (atual, card) =>
      temCard(atual, card.entidadeId) ? trocarNasPaginas(atual, card) : porNoTopo(atual, card),
    restantes,
  );
}
