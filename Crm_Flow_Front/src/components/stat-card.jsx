import { InteractiveCard } from '@/components/motion/interactive-card';
import { cn } from '@/lib/utils';

/**
 * Cartão de métrica Enterprise com valor em fonte Geist e números tabulares.
 */
export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  className,
  interactive = false,
}) {
  return (
    <InteractiveCard interactive={interactive} className={cn('p-4', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>
        </div>
        {Icon && (
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground">
            <Icon className="size-4" aria-hidden="true" />
          </div>
        )}
      </div>
      {description && <p className="mt-2.5 text-xs text-muted-foreground">{description}</p>}
    </InteractiveCard>
  );
}
