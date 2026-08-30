/**
 * @file Todos os meses sem snapshot: aviso acima do gráfico, que segue mostrando o realizado.
 */
import { CalendarClock } from 'lucide-react';

import { TEXTOS_ASSERTIVIDADE } from '../../../lib/assertividade-textos';

/** Todos os meses sem snapshot: aviso acima do gráfico, que segue mostrando o realizado. */
export function AssertividadeVazia() {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-border bg-surface p-3 text-sm"
      role="status"
    >
      <CalendarClock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <p>{TEXTOS_ASSERTIVIDADE.todosSemDados}</p>
    </div>
  );
}
