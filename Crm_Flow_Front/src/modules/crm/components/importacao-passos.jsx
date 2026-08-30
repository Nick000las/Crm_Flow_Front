import { cn } from '@/lib/utils';
import { PASSOS } from '../lib/importacao';

/**
 * `1 Arquivo · 2 Mapear · 3 Revisar · 4 Processar`. Informativo: a
 * navegação entre passos é pelos botões de cada um.
 *
 * @param {{ atual: string }} props
 */
export function ImportacaoPassos({ atual }) {
  const indiceAtual = PASSOS.findIndex((passo) => passo.id === atual);

  return (
    <ol
      aria-label="Etapas da importação"
      className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
    >
      {PASSOS.map((passo, indice) => {
        const ativo = indice === indiceAtual;
        const feito = indice < indiceAtual;

        return (
          <li
            aria-current={ativo ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2',
              ativo ? 'font-medium text-foreground' : 'text-muted-foreground',
            )}
            key={passo.id}
          >
            <span
              className={cn(
                'grid size-5 place-items-center border font-mono text-[11px] tabular-nums',
                ativo ? 'border-foreground' : 'border-border',
                feito && 'bg-muted',
              )}
            >
              {indice + 1}
            </span>
            {passo.rotulo}
            {feito && <span className="sr-only">(concluída)</span>}
          </li>
        );
      })}
    </ol>
  );
}
