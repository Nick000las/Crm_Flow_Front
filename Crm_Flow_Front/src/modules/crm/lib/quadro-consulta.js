import { CHAVES_FIXAS_CICLO } from './ciclo-de-vida.js';
import { contarFiltros, paraCorpoDeBusca } from './filtro.js';
import { avisoDeProbabilidade, juntarAvisos } from './probabilidade.js';

/**
 * Filtro e ordem do quadro comercial (M4): quem filtra e ordena é o servidor.
 * O filtro é o mesmo da tabela; a ordem vale só para o quadro.
 *
 * @typedef {'atualizadoEm' | 'criadoEm' | 'nome' | 'valor' | 'dataPrevistaFechamento' | 'probabilidadeFechamento'} CampoDeOrdem
 * @typedef {{ campo: CampoDeOrdem, direcao: 'asc' | 'desc' }} OrdemDoQuadro
 * @typedef {{ filtros?: Record<string, unknown>, ordem?: OrdemDoQuadro }} ConsultaDoQuadro
 *   chave ausente = o padrão do back
 */

export const DIRECAO = Object.freeze({ ASC: 'asc', DESC: 'desc' });

/** @type {OrdemDoQuadro} */
export const ORDEM_PADRAO = Object.freeze({ campo: 'atualizadoEm', direcao: DIRECAO.DESC });

/** `exigeCampo`: o campo tem a mesma chave em `/fields`; sem ele, a ordem dá 400. */
const ORDENS = Object.freeze([
  { campo: 'atualizadoEm', rotulo: 'Última atualização' },
  { campo: 'criadoEm', rotulo: 'Data de criação' },
  { campo: 'nome', rotulo: 'Nome' },
  { campo: 'valor', rotulo: 'Valor', exigeCampo: true },
  { campo: 'dataPrevistaFechamento', rotulo: 'Data prevista', exigeCampo: true },
  { campo: 'probabilidadeFechamento', rotulo: 'Probabilidade', exigeCampo: true },
]);

const DIRECOES = new Set(Object.values(DIRECAO));

const AVISO_MOVIDO = 'Card movido.';
const AVISO_CONFLITO = 'Card movido, mas outra pessoa mexeu nesta oportunidade antes. Confira.';
const AVISO_SAIU_DO_FILTRO = 'Movido. Não aparece no filtro atual.';
const AVISO_CONFLITO_FORA_DO_FILTRO = `${AVISO_SAIU_DO_FILTRO} Outra pessoa mexeu nesta oportunidade antes.`;

/**
 * Ordens que este papel pode escolher.
 *
 * @param {{ chave: string }[]} campos todos os de `/fields`
 * @returns {{ valor: CampoDeOrdem, rotulo: string }[]}
 */
export function opcoesDeOrdem(campos) {
  return ORDENS.filter(
    ({ campo, exigeCampo }) => !exigeCampo || campos.some((atual) => atual.chave === campo),
  ).map(({ campo, rotulo }) => ({ valor: campo, rotulo }));
}

/**
 * Ordem salva → ordem que dá para pedir. O `localStorage` pode trazer lixo, ou
 * um campo que o papel deixou de ver.
 *
 * @param {unknown} salva
 * @param {{ chave: string }[]} campos
 * @returns {OrdemDoQuadro}
 */
export function ordemValida(salva, campos) {
  const { campo, direcao } = /** @type {Partial<OrdemDoQuadro>} */ (salva ?? {});
  const disponivel = opcoesDeOrdem(campos).some((opcao) => opcao.valor === campo);

  return disponivel && DIRECOES.has(direcao) ? { campo, direcao } : ORDEM_PADRAO;
}

/** @param {import('./filtro.js').FiltroAplicado} filtro */
const semCiclo = (filtro) =>
  /** @type {import('./filtro.js').FiltroAplicado} */ (
    Object.fromEntries(
      Object.entries(filtro).filter(([chave]) => !CHAVES_FIXAS_CICLO.includes(chave)),
    )
  );

/**
 * Corpo comum de `/cards/busca`, e os `filtros` também vão em `/resumo` e em
 * `/mover`. Sem filtro, a chave some: `/mover` só compara com o filtro quando
 * há um na tela. Os filtros do ciclo de vida (FC4) ficam de fora: o contrato
 * do FC4 só cobre a busca da lista, as views e o export, então uma view salva
 * na lista não dá 400 no quadro.
 *
 * @param {{ busca: string, filtro: import('./filtro.js').FiltroAplicado }} estado
 * @param {OrdemDoQuadro} ordem
 * @returns {ConsultaDoQuadro}
 */
export function montarConsulta({ busca, filtro: filtroDaTela }, ordem) {
  const filtro = semCiclo(filtroDaTela);
  const comFiltro = Boolean(busca) || contarFiltros(filtro) > 0;
  const ordemPadrao = ordem.campo === ORDEM_PADRAO.campo && ordem.direcao === ORDEM_PADRAO.direcao;

  return {
    ...(comFiltro && { filtros: { ...(busca && { busca }), ...paraCorpoDeBusca(filtro) } }),
    ...(!ordemPadrao && { ordem }),
  };
}

/**
 * @typedef {{
 *   conflito: boolean,
 *   saiuDoFiltro: boolean,
 *   avisos?: import('./probabilidade.js').AvisoDaResposta[],
 * }} RespostaDoMover
 */

/** @param {RespostaDoMover} resposta */
function avisoDaPosicao({ conflito, saiuDoFiltro }) {
  if (conflito && saiuDoFiltro) {
    return AVISO_CONFLITO_FORA_DO_FILTRO;
  }
  if (saiuDoFiltro) {
    return AVISO_SAIU_DO_FILTRO;
  }
  return conflito ? AVISO_CONFLITO : null;
}

/**
 * Aviso depois de arrastar. `null` quando deu tudo certo e o card está à vista.
 * A probabilidade redefinida (FC1) entra junto; o mover não traz a efetiva,
 * então `padraoDoDestino` é a do status da coluna de destino.
 *
 * @param {RespostaDoMover} resposta
 * @param {number | null} [padraoDoDestino]
 * @returns {string | null}
 */
export function avisoDoMovimento(resposta, padraoDoDestino) {
  return juntarAvisos(
    avisoDaPosicao(resposta),
    avisoDeProbabilidade(resposta.avisos, padraoDoDestino),
  );
}

/**
 * Aviso depois do form de `CAMPOS_OBRIGATORIOS`: ele acabou de se fechar, então
 * sempre confirma.
 *
 * @param {RespostaDoMover} resposta
 * @param {number | null} [padraoDoDestino]
 */
export function avisoDoFormulario(resposta, padraoDoDestino) {
  return juntarAvisos(
    avisoDaPosicao(resposta) ?? AVISO_MOVIDO,
    avisoDeProbabilidade(resposta.avisos, padraoDoDestino),
  );
}
