import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTenantStatusLabel, getTenantStatusTone } from '../lib/tenant-status';

/**
 * Rótulo e indicador de status; o tema claro aplica superfícies semânticas suaves.
 */
export function TenantStatusBadge({ status, className }) {
  const tone = getTenantStatusTone(status);

  return (
    <Badge
      data-status={status}
      className={cn(
        'theme-tenant-status gap-1.5 border-border px-2 text-[11px] uppercase tracking-wide',
        tone,
        className,
      )}
      variant="outline"
    >
      <span className="size-1.5 shrink-0 bg-current" aria-hidden="true" />
      {getTenantStatusLabel(status)}
    </Badge>
  );
}
