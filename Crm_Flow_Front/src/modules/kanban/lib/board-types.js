/**
 * @file Reúne operações reutilizáveis de board types, mantendo cálculos e transformações
 * independentes da interface.
 */
const BOARD_TYPE_LABELS = {
  projetos: 'Projetos',
  postagens_agencia: 'Postagens',
  crm_oportunidades: 'Pipeline',
};

export function getBoardTypeLabel(boardType) {
  return BOARD_TYPE_LABELS[boardType] ?? 'Quadro de trabalho';
}
