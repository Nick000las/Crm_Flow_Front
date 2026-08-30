/**
 * @file Lista reordenável por arrastar (Campos, Listas e o que vier).
 */
import { useRef } from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import { canScrollDragArea, dragBoundsModifier } from '@/lib/drag-bounds';

import { anunciosDeOrdem, INSTRUCOES_ORDEM } from './textos-ordem';

// Um clique no puxador não deve virar arrasto sem querer.
const DISTANCIA_MINIMA_PX = 4;

const limitarLista = dragBoundsModifier(undefined, { axis: 'vertical' });

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
  const boundary = useRef(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DISTANCIA_MINIMA_PX } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const posicaoDe = (id) => ids.indexOf(id) + 1;

  function handleDragEnd({ active, over }) {
    boundary.current = null;

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
      modifiers={[limitarLista]}
      autoScroll={{ canScroll: (element) => canScrollDragArea(element, boundary.current) }}
      onDragStart={({ active }) => {
        boundary.current = active.data.current?.dragBoundary?.();
      }}
      onDragCancel={() => {
        boundary.current = null;
      }}
      onDragEnd={handleDragEnd}
      sensors={sensores}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}
