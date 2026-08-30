/**
 * Textos do arrastar para leitor de tela (dnd-kit `accessibility`), em pt-BR.
 * O dnd-kit anuncia em inglês por padrão.
 */

export const INSTRUCOES_ORDEM =
  'Para reordenar, pressione espaço ou Enter no puxador, use as setas para cima e para baixo ' +
  'e pressione espaço ou Enter de novo para soltar. Esc cancela.';

/**
 * @param {(id: string) => string} rotuloDe
 * @param {(id: string) => number} posicaoDe 1-based
 * @param {number} total
 */
export function anunciosDeOrdem(rotuloDe, posicaoDe, total) {
  const posicao = (id) => `posição ${posicaoDe(id)} de ${total}`;

  return {
    onDragStart: ({ active }) => `${rotuloDe(active.id)} selecionado, ${posicao(active.id)}.`,
    onDragOver: ({ active, over }) =>
      over
        ? `${rotuloDe(active.id)} na ${posicao(over.id)}.`
        : `${rotuloDe(active.id)} fora da lista.`,
    onDragEnd: ({ active, over }) =>
      over
        ? `${rotuloDe(active.id)} solto na ${posicao(over.id)}.`
        : `${rotuloDe(active.id)} solto.`,
    onDragCancel: ({ active }) => `Reordenação cancelada. ${rotuloDe(active.id)} voltou ao lugar.`,
  };
}
