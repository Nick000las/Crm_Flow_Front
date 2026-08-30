/**
 * @file Renderiza avisos breves flutuantes (`role="status"`) sem causar deslocamento de layout.
 */
import { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * Aviso discreto flutuante (`role="status"`): comunica confirmações breves
 * sem deslocar colunas, tabelas ou formulários no fluxo da página.
 */
export function StatusToast({ message, onDismiss, duration = 5000 }) {
  const [dismissed, setDismissed] = useState(null);
  const visible = Boolean(message) && message !== dismissed;

  useEffect(() => {
    if (!visible || !duration) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setDismissed(message);
      onDismiss?.();
    }, duration);

    return () => window.clearTimeout(timer);
  }, [visible, message, duration, onDismiss]);

  if (!visible) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-5 bottom-5 z-40 flex max-w-md items-start gap-2.5 rounded-xl border border-border bg-popover px-4 py-3 text-xs font-medium text-popover-foreground shadow-lg"
    >
      <Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <p className="leading-relaxed">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label="Fechar aviso"
        className="-mt-0.5 -mr-1.5 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={() => {
          setDismissed(message);
          onDismiss?.();
        }}
      >
        <X className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}
