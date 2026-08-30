import { cn } from '@/lib/utils';

/**
 * Estado vazio padronizado para listas, quadros, tabelas e módulos sem dados.
 */
export function EmptyState({ icon: Icon, title, description, action, children, className }) {
  return (
    <div
      className={cn(
        'theme-empty-state flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong/70 bg-surface/60 px-6 py-14 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="theme-empty-icon mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground shadow-xs">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      {title && <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>}
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {(action || children) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {children}
        </div>
      )}
    </div>
  );
}
