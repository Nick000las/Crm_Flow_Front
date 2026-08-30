/**
 * @file Cards dos blocos fora dos meses. Cada um é um botão que abre a lista.
 */
import { AlertTriangle } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Cards dos blocos fora dos meses. Cada um é um botão que abre a lista.
 *
 * @param {{
 *   cards: import('../../lib/forecast-vista').CardDoBloco[],
 *   blocoAberto: string | null,
 *   onAbrirBloco: (chave: string) => void,
 * }} props
 */
export function CardsBlocos({ cards, blocoAberto, onAbrirBloco }) {
  return (
    <ul
      data-tour="crm-forecast-blocks"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    >
      {cards.map((card) => {
        const aberto = blocoAberto === card.chave;

        return (
          <li key={card.chave}>
            <button
              aria-pressed={aberto}
              className={cn(
                'grid h-full w-full content-start gap-2 rounded-xl border bg-card p-4 text-left shadow-xs outline-none transition-colors duration-150',
                'focus-visible:ring-2 focus-visible:ring-ring/50',
                card.alerta ? 'border-warning/50' : 'border-border',
                card.clicavel && 'cursor-pointer hover:border-primary/40 hover:bg-accent',
                aberto && 'border-primary bg-primary/5 ring-1 ring-primary/25',
                !card.clicavel && 'cursor-not-allowed opacity-60',
              )}
              disabled={!card.clicavel}
              onClick={() => onAbrirBloco(card.chave)}
              title={card.ajuda}
              type="button"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {card.alerta && card.quantidade > 0 && (
                  <>
                    <AlertTriangle aria-hidden="true" className="size-3.5 shrink-0 text-warning" />
                    <span className="sr-only">Pede atenção: </span>
                  </>
                )}
                {card.rotulo}
              </span>
              <span className="text-2xl font-semibold tracking-tight tabular-nums">
                {card.quantidade}
              </span>
              {card.soma !== null && (
                <span className="text-xs tabular-nums text-muted-foreground">Soma {card.soma}</span>
              )}
              {card.ponderado !== null && (
                <span className="text-xs tabular-nums text-muted-foreground">
                  Ponderado {card.ponderado}
                </span>
              )}
              {card.ajuda && (
                <span className="mt-auto pt-1 text-[11px] leading-snug text-muted-foreground/85">
                  {card.ajuda}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
