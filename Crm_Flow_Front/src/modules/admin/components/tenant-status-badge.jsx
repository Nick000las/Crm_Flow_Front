import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTenantStatusLabel, getTenantStatusTone } from '../lib/tenant-status';

/**
 * Selo de status: borda de 1px, canto reto e um quadrado sólido de 6px — não a
 * pílula preenchida padrão do `Badge`. Mantém a tela quase monocromática e
 * deixa o preenchimento de cor para os poucos lugares que o design system
 * reserva ao accent.
 */
export function TenantStatusBadge({ status, className }) {
  const tone = getTenantStatusTone(status);

  return (
    <Badge
      className={cn(
        'gap-1.5 rounded-none border-border px-2 font-mono text-[11px] uppercase tracking-wide',
        tone,
        className,
      )}
      variant="outline"
    >
      <span
        className="size-1.5 shrink-0 bg-current"
        aria-hidden="true"
      />
      {getTenantStatusLabel(status)}
    </Badge>
  );
}
