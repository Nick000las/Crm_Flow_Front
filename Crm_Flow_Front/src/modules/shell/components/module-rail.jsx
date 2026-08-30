import { LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { MODULES, UTILITY_ITEMS } from '@/lib/modules-registry';
import { cn } from '@/lib/utils';

const ITEM_BASE =
  'relative grid size-9 place-items-center rounded-md outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/50';
const ITEM_INACTIVE =
  'text-background/55 hover:bg-background/10 hover:text-background';
// Único ponto de cor de destaque do Rail.
const ITEM_ACTIVE = 'bg-primary/15 text-primary';

function RailLink({ item, isActive }) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={item.path}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(ITEM_BASE, isActive ? ITEM_ACTIVE : ITEM_INACTIVE)}
          >
            {isActive && (
              <span
                className="absolute inset-y-1 -left-2 w-0.5 bg-primary"
                aria-hidden="true"
              />
            )}
            <Icon className="size-4.5" aria-hidden="true" />
          </Link>
        }
      />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

export function ModuleRail() {
  const { logout } = useAuth();
  const { pathname } = useLocation();

  const isItemActive = (item) => pathname.startsWith(item.path);

  return (
    <nav
      className="flex w-14 shrink-0 flex-col items-center gap-1 bg-foreground py-3"
      aria-label="Módulos"
    >
      {MODULES.map((entry) => (
        <RailLink key={entry.key} item={entry} isActive={isItemActive(entry)} />
      ))}

      <div className="mt-auto flex flex-col items-center gap-1">
        {UTILITY_ITEMS.map((item) => (
          <RailLink key={item.key} item={item} isActive={isItemActive(item)} />
        ))}

        <Tooltip>
          <TooltipTrigger
            aria-label="Sair"
            className={cn(ITEM_BASE, ITEM_INACTIVE)}
            onClick={() => logout()}
          >
            <LogOut className="size-4.5" aria-hidden="true" />
          </TooltipTrigger>
          <TooltipContent side="right">Sair</TooltipContent>
        </Tooltip>
      </div>
    </nav>
  );
}
