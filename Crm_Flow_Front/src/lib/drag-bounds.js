/**
 * @file Impede autoscroll de passar da área útil, preservando listas longas e quadros largos.
 */
/** Limita deslocamento sem alterar escala nem permitir que o item ultrapasse a área. */
export function clampDragTransform(transform, item, bounds, axis) {
  if (!item || !bounds) {
    return { ...transform, ...(axis === 'vertical' && { x: 0 }) };
  }

  const minX = bounds.left - item.left;
  const maxX = Math.max(minX, bounds.right - item.right);
  const minY = bounds.top - item.top;
  const maxY = Math.max(minY, bounds.bottom - item.bottom);

  return {
    ...transform,
    x: axis === 'vertical' ? 0 : Math.min(Math.max(transform.x, minX), maxX),
    y: Math.min(Math.max(transform.y, minY), maxY),
  };
}

/** Interseção com viewport e ancestrais que recortam/rolam o conteúdo. */
export function visibleDragBounds(element) {
  if (!element?.isConnected) {
    return null;
  }

  const view = element.ownerDocument.defaultView;
  const rect = element.getBoundingClientRect();
  const bounds = {
    left: Math.max(0, rect.left),
    top: Math.max(0, rect.top),
    right: Math.min(view.innerWidth, rect.right),
    bottom: Math.min(view.innerHeight, rect.bottom),
  };

  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const style = view.getComputedStyle(parent);
    const parentRect = parent.getBoundingClientRect();

    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
      bounds.left = Math.max(bounds.left, parentRect.left);
      bounds.right = Math.min(bounds.right, parentRect.right);
    }

    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
      bounds.top = Math.max(bounds.top, parentRect.top);
      bounds.bottom = Math.min(bounds.bottom, parentRect.bottom);
    }
  }

  return bounds.right > bounds.left && bounds.bottom > bounds.top ? bounds : null;
}

/** Modifier comum a listas, editor de formulários e overlays de quadros. */
export function dragBoundsModifier(getBoundary, { axis } = {}) {
  return ({ active, activeNodeRect, draggingNodeRect, transform }) => {
    const element = getBoundary?.() ?? active?.data.current?.dragBoundary?.();
    const bounds = visibleDragBounds(element);

    if (element && !bounds) {
      return { ...transform, x: 0, y: 0 };
    }

    return clampDragTransform(transform, activeNodeRect ?? draggingNodeRect, bounds, axis);
  };
}

/** Impede autoscroll de passar da área útil, preservando listas longas e quadros largos. */
export function canScrollDragArea(element, boundary) {
  if (!boundary || element === boundary) {
    return true;
  }

  if (!element.contains(boundary)) {
    return boundary.contains(element);
  }

  const outer = element.getBoundingClientRect();
  const inner = boundary.getBoundingClientRect();
  const vertical =
    element.scrollHeight > element.clientHeight &&
    (inner.top < outer.top || inner.bottom > outer.bottom);
  const horizontal =
    element.scrollWidth > element.clientWidth &&
    (inner.left < outer.left || inner.right > outer.right);

  return vertical || horizontal;
}
