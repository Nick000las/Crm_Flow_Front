/**
 * @file Renderiza page sidebar, na área de navegação, expondo os estados e eventos necessários
 * à interface.
 */
import { ChevronsUpDown, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useLocation } from 'react-router-dom';

import { TRANSITION_FAST } from '@/components/motion/motion-tokens';
import { useAuth } from '@/hooks/useAuth';
import { isMacPlatform } from '@/lib/keyboard-shortcuts';
import { isPageActive } from '@/lib/modules-registry';
import { cn } from '@/lib/utils';

import { getInitials } from '../lib/user-initials';
import { AccountMenu } from './account-menu';

export function PageSidebar({
  module,
  className,
  onNavigate,
  onOpenPalette,
  onOpenShortcuts,
  layoutScope = 'desktop',
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const ModuleIcon = module.icon;
  const initials = getInitials(user?.nome, user?.email);
  const shortcutLabel = isMacPlatform() ? '⌘K' : 'Ctrl K';

  return (
    <aside
      data-module={module.key}
      className={cn(
        'theme-page-sidebar w-60 shrink-0 flex-col border-r border-border bg-surface/70',
        className,
      )}
      aria-label={`Páginas de ${module.label}`}
    >
      {/* Cabeçalho do módulo */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
        {ModuleIcon && (
          <span className="theme-sidebar-icon grid size-8 shrink-0 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
            <ModuleIcon className="size-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-foreground">
            {module.label}
          </p>
          {module.subtitle && (
            <p className="truncate text-[11px] text-muted-foreground">{module.subtitle}</p>
          )}
        </div>
      </div>

      {/* Atalho para paleta de comandos */}
      {onOpenPalette && (
        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={onOpenPalette}
            className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-border bg-card/80 px-2.5 py-1.5 text-xs text-muted-foreground shadow-2xs outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5" aria-hidden="true" />
              <span>Ir para…</span>
            </span>
            <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              {shortcutLabel}
            </kbd>
          </button>
        </div>
      )}

      {/* Lista de páginas */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2.5 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/80 uppercase">
          Navegação
        </p>

        <nav className="grid gap-1">
          {module.pages.map((page) => {
            const isActive = isPageActive(page, pathname);
            const PageIcon = page.icon;

            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                key={page.key}
                to={page.path}
                onClick={onNavigate}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/40',
                  isActive
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground',
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId={`sidebar-active-${layoutScope}-${module.key}`}
                    transition={TRANSITION_FAST}
                    className="absolute inset-0 rounded-lg border border-border bg-card shadow-xs"
                    aria-hidden="true"
                  />
                )}
                {PageIcon && (
                  <PageIcon
                    className={cn(
                      'relative z-10 size-4 shrink-0 transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground group-hover:text-foreground',
                    )}
                    aria-hidden="true"
                  />
                )}
                <span className="relative z-10 truncate">{page.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Rodapé com menu da conta */}
      {user && (
        <div className="border-t border-border p-3">
          <AccountMenu
            side="top"
            align="start"
            onNavigate={onNavigate}
            onOpenShortcuts={onOpenShortcuts}
            trigger={
              <button
                type="button"
                aria-label="Abrir menu da conta"
                className="group flex w-full cursor-pointer items-center gap-2.5 rounded-xl border border-transparent p-2 text-left outline-none transition-colors duration-150 hover:border-border hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/40 data-popup-open:border-border data-popup-open:bg-card"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg border border-border bg-card text-xs font-semibold text-foreground shadow-xs"
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {user.nome || user.email}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {user.role ? String(user.role).toLowerCase() : user.email}
                  </p>
                </div>
                <ChevronsUpDown
                  className="size-3.5 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </button>
            }
          />
        </div>
      )}
    </aside>
  );
}
