import { useAuth } from '@/hooks/useAuth';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function PageSidebar({ module, className }) {
  const { user } = useAuth();
  const pages = module.pages.filter((page) => !page.roles || page.roles.includes(user?.role));
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
        {pages.map((page) => (
          <NavLink
            key={page.key}
            to={page.path}
            end
            className={({ isActive }) =>
              cn(
                'rounded-md px-3 py-2 text-sm outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50',
                isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )
            }
          >
            {page.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
