import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { INSTRUCOES_ORDEM, anunciosDeOrdem } from './textos-ordem';

// Um clique no puxador não deve virar arrasto sem querer.
const DISTANCIA_MINIMA_PX = 4;

/** O arrasto anda só na vertical. */
const somenteVertical = ({ transform }) => ({ ...transform, x: 0 });

/**
 * Lista reordenável por arrastar (Campos, Listas e o que vier). Teclado: o
 * puxador segue o padrão do dnd-kit (espaço pega, setas movem, espaço solta)
 * e os botões ↑/↓ de cada linha continuam como atalho — MASTER_DOCUMENT §4.3.
 * Anúncios para leitor de tela em pt-BR; o dnd-kit os renderiza num portal
 * no `body`, então isto pode envolver uma `<table>` sem quebrar o HTML.
 *
 * As linhas usam `useLinhaOrdenavel` e `PuxadorOrdem`.
 *
 * @param {{
 *   ids: string[],
 *   rotuloDe: (id: string) => string,
 *   onMover: (de: number, para: number) => void,
 *   children: import('react').ReactNode,
 * }} props
 */
export function ListaOrdenavel({ ids, rotuloDe, onMover, children }) {
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DISTANCIA_MINIMA_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const posicaoDe = (id) => ids.indexOf(id) + 1;

  function handleDragEnd({ active, over }) {
    if (over && active.id !== over.id) {
      onMover(ids.indexOf(active.id), ids.indexOf(over.id));
    }
  }

  return (
    <DndContext
      accessibility={{
        announcements: anunciosDeOrdem(rotuloDe, posicaoDe, ids.length),
        screenReaderInstructions: { draggable: INSTRUCOES_ORDEM },
      }}
      collisionDetection={closestCenter}
      modifiers={[somenteVertical]}
      onDragEnd={handleDragEnd}
      sensors={sensores}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
