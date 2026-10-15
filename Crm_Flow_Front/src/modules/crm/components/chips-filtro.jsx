import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Filtros aplicados, um chip por filtro, abaixo da toolbar. Chip apontado
 * pelo back num 400 (`filtros.<chave>`) fica destacado — caso típico: view
 * salva com um campo que depois foi desligado.
 *
 * @param {{
 *   chips: ReturnType<typeof import('../lib/filtro').chipsDoFiltro>,
 *   chavesComErro: Set<string>,
 *   onRemover: (chip: { remover: () => object }) => void,
 *   onLimpar: () => void,
 * }} props
 */
export function ChipsFiltro({ chips, chavesComErro, onRemover, onLimpar }) {
  if (chips.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-1.5">
      <ul aria-label="Filtros aplicados" className="contents">
        {chips.map((chip) => {
          const comErro = chip.chave !== undefined && chavesComErro.has(chip.chave);

          return (
            <li
              className={cn(
                'inline-flex items-center gap-1 border px-2 py-1 text-xs',
                comErro ? 'border-destructive text-destructive' : 'border-border',
              )}
              key={chip.id}
            >
              {comErro && <span className="sr-only">Com erro: </span>}
              {chip.texto}
              <button
                aria-label={`Remover filtro: ${chip.texto}`}
                className="text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
                onClick={() => onRemover(chip)}
                type="button"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </li>
          );
        })}
      </ul>
      <Button className="h-7 rounded-none px-2 text-xs" onClick={onLimpar} variant="ghost">
        Limpar tudo
      </Button>
    </div>
  );
}
