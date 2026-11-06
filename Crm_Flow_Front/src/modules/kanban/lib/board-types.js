const BOARD_TYPE_LABELS = {
  projetos: 'Projetos',
  postagens_agencia: 'Postagens',
};

export function getBoardTypeLabel(boardType) {
  return BOARD_TYPE_LABELS[boardType] ?? 'Quadro de trabalho';
}
