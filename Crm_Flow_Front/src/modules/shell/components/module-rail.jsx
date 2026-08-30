/**
 * @file Renderiza module rail, na área de navegação, expondo os estados e eventos necessários à
 * interface.
 */
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';

import { TRANSITION_FAST } from '@/components/motion/motion-tokens';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { SinoNotificacoes } from '@/modules/notificacoes/components/sino-notificacoes';

import { getInitials } from '../lib/user-initials';
import { AccountMenu } from './account-menu';

const ITEM_BASE =
  'relative grid size-9.5 place-items-center rounded-xl outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-sidebar-ring';
const ITEM_INACTIVE =
  'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground';
const ITEM_ACTIVE = 'text-primary';

function FlowMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-4.5"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 4 8 C 9 8 9 13 14 13 L 20 13" />
      <path d="M 16 9.5 L 20 13 L 16 16.5" />
      <path d="M 4 16 L 10 16 C 13 16 14 18.5 17 18.5" opacity="0.45" />
    </svg>
  );
}

function RailLink({ item, isActive, layoutScope, onNavigate }) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={item.path}
            onClick={onNavigate}
            data-module={item.key}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(ITEM_BASE, isActive ? ITEM_ACTIVE : ITEM_INACTIVE)}
          >
            {isActive && (
              <>
                <motion.span
                  layoutId={`${layoutScope}-module-rail-pill`}
                  transition={TRANSITION_FAST}
                  className="theme-rail-pill absolute inset-0 rounded-xl border border-primary/25 bg-primary/16 shadow-xs"
                  aria-hidden="true"
                />
                <motion.span
                  layoutId={`${layoutScope}-module-rail-bar`}
                  transition={TRANSITION_FAST}
                  className="theme-rail-bar absolute inset-y-2 -left-2.5 w-0.5 rounded-full bg-primary"
                  aria-hidden="true"
                />
              </>
            )}
            <Icon className="relative z-10 size-4.5" aria-hidden="true" />
          </Link>
        }
      />
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

/** @param {{ modules: import('@/lib/modules-registry').ModuleEntry[], onOpenShortcuts?: () => void, showAccountMenu?: boolean }} props */
export function ModuleRail({
  modules,
  onOpenShortcuts,
  onNavigate,
  showAccountMenu = false,
  className,
  layoutScope = 'desktop',
}) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const initials = getInitials(user?.nome, user?.email);

  const isItemActive = (item) => pathname.startsWith(item.path);

  return (
    <nav
      className={cn(
        'theme-module-rail flex w-15 shrink-0 flex-col items-center overflow-y-auto border-r border-sidebar-border bg-sidebar py-3',
        className,
      )}
      aria-label="Módulos"
    >
      <div
        className="mb-3 grid size-9.5 place-items-center text-primary"
        role="img"
        aria-label="Flow CRM"
      >
        <FlowMark />
      </div>

      <div className="mb-3 h-px w-6 bg-sidebar-border" aria-hidden="true" />

      <div className="flex flex-col items-center gap-1.5">
        {modules.map((entry) => (
          <RailLink
            key={entry.key}
            item={entry}
            isActive={isItemActive(entry)}
            layoutScope={layoutScope}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1.5 pt-3">
        <div className="mb-1.5 h-px w-6 bg-sidebar-border" aria-hidden="true" />

        {/* Core, sem flag: todo usuário logado tem o sino. */}
        <SinoNotificacoes triggerClassName={cn(ITEM_BASE, ITEM_INACTIVE)} />

        {/* Quando não há PageSidebar (ex.: em /configuracoes), o menu da conta fica acessível pelo avatar no Rail. */}
        {showAccountMenu && user && (
          <AccountMenu
            side="right"
            align="end"
            onNavigate={onNavigate}
            onOpenShortcuts={onOpenShortcuts}
            trigger={
              <button
                type="button"
                aria-label="Abrir menu da conta"
                title={user.nome || user.email}
                className={cn(
                  ITEM_BASE,
                  'cursor-pointer border border-sidebar-border bg-card text-xs font-semibold text-foreground shadow-xs hover:border-border-strong',
                )}
              >
                {initials}
              </button>
            }
          />
        )}
      </div>
    </nav>
  );
}
