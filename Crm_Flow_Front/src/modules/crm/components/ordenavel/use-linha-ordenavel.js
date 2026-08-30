/**
 * @file Liga uma linha (`<tr>`) ao `ListaOrdenavel`. Devolve as props da linha e as do puxador,
 * já com o motion de 200 ms do design system.
 */
import { useCallback, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';

const TRANSICAO = Object.freeze({ duration: 200, easing: 'ease' });

/**
 * Liga uma linha (`<tr>`) ao `ListaOrdenavel`. Devolve as props da linha e
 * as do puxador, já com o motion de 200 ms do design system.
 *
 * @param {string} id
 * @param {boolean} desabilitado enquanto uma reordenação está salvando
 */
export function useLinhaOrdenavel(id, desabilitado) {
  const node = useRef(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled: desabilitado,
    data: { dragBoundary: () => node.current?.parentElement },
    transition: TRANSICAO,
  });

  const attachNode = useCallback(
    (element) => {
      node.current = element;
      setNodeRef(element);
    },
    [setNodeRef],
  );

  return {
    linha: {
      ref: attachNode,
      className: cn(isDragging && 'relative z-10 bg-muted'),
      style: { transform: CSS.Translate.toString(transform), transition },
    },
    puxador: { ...attributes, ...listeners, ref: setActivatorNodeRef, disabled: desabilitado },
  };
}
