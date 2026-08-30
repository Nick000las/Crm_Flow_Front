/**
 * @file Mantém a prévia HTML5 dentro do quadro sem mudar os contratos nativos de drop.
 */
import { useCallback, useEffect, useRef } from 'react';

import { clampDragTransform, visibleDragBounds } from '@/lib/drag-bounds';

/** Mantém a prévia HTML5 dentro do quadro sem mudar os contratos nativos de drop. */
export function useBoundedNativeDrag(enabled) {
  const cleanup = useRef(() => {});
  const stop = useCallback(() => cleanup.current(), []);

  useEffect(() => {
    if (!enabled) {
      stop();
    }

    return stop;
  }, [enabled, stop]);

  const start = useCallback(
    (event) => {
      stop();

      const source = event.currentTarget;
      const boundary = source.closest('[data-drag-boundary]');

      if (!boundary) {
        return;
      }

      const document = source.ownerDocument;
      const view = document.defaultView;
      const rect = source.getBoundingClientRect();
      const offset = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const preview = source.cloneNode(true);

      preview.removeAttribute('id');
      preview.removeAttribute('data-dragging');
      preview.removeAttribute('draggable');
      preview.setAttribute('data-drag-preview', 'true');
      preview.setAttribute('aria-hidden', 'true');
      preview.inert = true;
      preview.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));

      Object.assign(preview.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '1000',
        width: `${rect.width}px`,
        margin: '0',
        overflow: 'hidden',
        transition: 'none',
      });

      const blank = document.createElement('canvas');

      blank.width = 1;
      blank.height = 1;
      Object.assign(blank.style, { position: 'fixed', top: '0', left: '0', pointerEvents: 'none' });
      document.body.append(blank, preview);
      event.dataTransfer.setDragImage(blank, 0, 0);

      const update = (pointer) => {
        const bounds = visibleDragBounds(boundary);

        preview.style.visibility = bounds ? 'visible' : 'hidden';

        if (!bounds) {
          return;
        }

        const width = Math.min(rect.width, bounds.right - bounds.left);
        const height = Math.min(rect.height, bounds.bottom - bounds.top);
        const item = {
          left: rect.left,
          top: rect.top,
          right: rect.left + width,
          bottom: rect.top + height,
        };
        const transform = clampDragTransform(
          { x: pointer.clientX - offset.x - rect.left, y: pointer.clientY - offset.y - rect.top },
          item,
          bounds,
        );

        Object.assign(preview.style, {
          width: `${width}px`,
          maxHeight: `${height}px`,
          left: `${rect.left + transform.x}px`,
          top: `${rect.top + transform.y}px`,
        });
      };
      const resize = () => stop();

      view.addEventListener('dragover', update);
      view.addEventListener('dragend', stop);
      view.addEventListener('drop', stop);
      view.addEventListener('resize', resize);

      cleanup.current = () => {
        preview.remove();
        blank.remove();
        view.removeEventListener('dragover', update);
        view.removeEventListener('dragend', stop);
        view.removeEventListener('drop', stop);
        view.removeEventListener('resize', resize);
        cleanup.current = () => {};
      };

      update(event);
    },
    [stop],
  );

  return { start, stop };
}
