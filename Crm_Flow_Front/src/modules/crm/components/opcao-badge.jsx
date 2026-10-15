import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Só `ganho` e `perdido` ganham tom: carregam significado. O resto fica no
 * cinza da interface. O texto sempre acompanha — a cor nunca é a única pista.
 */
const TOM_POR_VALOR = Object.freeze({
  ganho: 'text-emerald-700 dark:text-emerald-400',
  perdido: 'text-destructive',
});

/**
 * Selo de opção de seleção: borda de 1px, canto reto, mesmo desenho do
 * `TenantStatusBadge`.
 *
 * @param {{ valor: string, rotulo: string, className?: string }} props
 */
export function OpcaoBadge({ valor, rotulo, className }) {
  const tom = TOM_POR_VALOR[valor];

  return (
    <Badge
      className={cn(
        'gap-1.5 rounded-none border-border px-1.5 text-[11px] font-normal',
        tom ?? 'text-foreground',
        className,
      )}
      variant="outline"
    >
      {tom && <span className="size-1.5 shrink-0 bg-current" aria-hidden="true" />}
      {rotulo}
    </Badge>
  );
}
