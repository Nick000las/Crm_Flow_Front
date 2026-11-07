const MODO_NATIVO = 'nativo';

/**
 * Tela de cada quadro de entidade: os módulos não se importam, conversam por
 * rota. Quadro de um tipo sem tela não aparece.
 */
const ROTA_POR_TIPO = Object.freeze({
  crm_oportunidades: (quadroRef) => `/kanban/pipeline/${encodeURIComponent(quadroRef)}`,
});

/**
 * `GET /kanban/boards` com a flag `kanban_universal.quadros_entidade` traz
 * também quadros de outro módulo (`modo: 'entidade'`), sem `id`: não abrem
 * pelas rotas `/kanban/boards/:id`. Sem a flag, o campo não vem.
 *
 * @param {{ modo?: string }} board
 */
export function modoDoQuadro(board) {
  return board.modo ?? MODO_NATIVO;
}

/**
 * Só os quadros que a gestão administra: quadro de entidade tem a estrutura no
 * módulo dono.
 *
 * @template {{ modo?: string }} Quadro
 * @param {Quadro[]} boards
 * @returns {Quadro[]}
 */
export function quadrosNativos(boards) {
  return boards.filter((board) => modoDoQuadro(board) === MODO_NATIVO);
}

/**
 * Quadro de entidade não tem `id` nem participantes.
 *
 * @param {{ modo?: string }} board
 */
export function ehQuadroDeEntidade(board) {
  return modoDoQuadro(board) !== MODO_NATIVO;
}

/**
 * @param {{ id?: string, modo?: string, boardType?: string, quadroRef?: string }} board
 * @returns {string | null} `null` = quadro de um tipo sem tela
 */
export function rotaDoQuadro(board) {
  if (!ehQuadroDeEntidade(board)) {
    return `/kanban?quadro=${board.id}`;
  }
  return ROTA_POR_TIPO[board.boardType]?.(board.quadroRef) ?? null;
}

/**
 * Os quadros que a galeria sabe abrir.
 *
 * @template {{ modo?: string, boardType?: string, quadroRef?: string }} Quadro
 * @param {Quadro[]} boards
 * @returns {Quadro[]}
 */
export function quadrosDaGaleria(boards) {
  return boards.filter((board) => rotaDoQuadro(board) !== null);
}
