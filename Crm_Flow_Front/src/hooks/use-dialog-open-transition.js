import { useLayoutEffect, useState } from 'react';

/** Rotas podem montar o diálogo já aberto; prepara a primeira entrada do Base UI. */
export function useDialogOpenTransition(open, onOpenChangeComplete) {
  const [ready, setReady] = useState(open !== true);

  useLayoutEffect(() => {
    if (ready) {
      return undefined;
    }
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  return {
    open: ready ? open : false,
    onOpenChangeComplete: (nextOpen) => {
      if (ready && (open === undefined || nextOpen === open)) {
        onOpenChangeComplete?.(nextOpen);
      }
    },
  };
}
