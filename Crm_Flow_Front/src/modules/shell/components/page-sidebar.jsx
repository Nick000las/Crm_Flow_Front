import { Link, useLocation } from 'react-router-dom';
import { isPageActive } from '@/lib/modules-registry';
import { cn } from '@/lib/utils';

export function PageSidebar({ module, className }) {
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        'w-56 shrink-0 flex-col border-r border-border bg-background px-3 py-4',
        className,
      )}
      aria-label={`Páginas de ${module.label}`}
    >
      <p className="px-3 pb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {module.label}
      </p>

      <nav className="grid gap-0.5">
        {module.pages.map((page) => {
          const isActive = isPageActive(page, pathname);

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              key={page.key}
              to={page.path}
              className={cn(
                'rounded-md px-3 py-2 text-sm outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50',
                isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              {page.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
