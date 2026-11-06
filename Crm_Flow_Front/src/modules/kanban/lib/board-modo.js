const MODO_NATIVO = 'nativo';

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
 * Só os quadros que as telas de hoje sabem abrir. O quadro de entidade entra
 * com a tela dele (M3 da integração CRM × Kanban).
 *
 * @template {{ modo?: string }} Quadro
 * @param {Quadro[]} boards
 * @returns {Quadro[]}
 */
export function quadrosNativos(boards) {
  return boards.filter((board) => modoDoQuadro(board) === MODO_NATIVO);
}
