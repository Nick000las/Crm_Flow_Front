/**
 * @file Renderiza page header, na área de aplicação, expondo os estados e eventos necessários à
 * interface.
 */
import { cn } from '@/lib/utils';

export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <header
      className={cn(
        'theme-page-header mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-2 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
