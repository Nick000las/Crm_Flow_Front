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
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => {
        const aberto = blocoAberto === card.chave;
        return (
          <li key={card.chave}>
            <button
              aria-pressed={aberto}
              className={cn(
                'grid h-full w-full content-start gap-1.5 border bg-card p-3 text-left outline-none transition-colors duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring/50',
                card.alerta ? 'border-amber-600/60 dark:border-amber-400/50' : 'border-border',
                card.clicavel && 'hover:bg-muted/50',
                aberto && 'border-foreground bg-muted/60',
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
                    <AlertTriangle
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-amber-700 dark:text-amber-400"
                    />
                    <span className="sr-only">Pede atenção: </span>
                  </>
                )}
                {card.rotulo}
              </span>
              <span className="font-mono text-2xl tabular-nums">{card.quantidade}</span>
              {card.soma !== null && (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  Soma {card.soma}
                </span>
              )}
              {card.ponderado !== null && (
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  Ponderado {card.ponderado}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
