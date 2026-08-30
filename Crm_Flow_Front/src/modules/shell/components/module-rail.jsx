import { ModalPresence } from '@/components/motion/modal-presence';
import { Keyboard, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { ThemeToggle } from '@/components/theme-toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TRANSITION_FAST } from '@/components/motion/motion-tokens';
import { useAuth } from '@/hooks/useAuth';
import { UTILITY_ITEMS } from '@/lib/modules-registry';
import { cn } from '@/lib/utils';
import { SinoNotificacoes } from '@/modules/notificacoes/components/sino-notificacoes';

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

function RailLink({ item, isActive }) {
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={item.path}
            data-module={item.key}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(ITEM_BASE, isActive ? ITEM_ACTIVE : ITEM_INACTIVE)}
          >
            {isActive && (
              <>
                <motion.span
                  layoutId="module-rail-pill"
                  transition={TRANSITION_FAST}
                  className="theme-rail-pill absolute inset-0 rounded-xl border border-primary/25 bg-primary/16 shadow-xs"
                  aria-hidden="true"
                />
                <motion.span
                  layoutId="module-rail-bar"
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

/** @param {{ modules: import('@/lib/modules-registry').ModuleEntry[], onOpenShortcuts?: () => void }} props */
export function ModuleRail({ modules, onOpenShortcuts }) {
  const { logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const { pathname } = useLocation();

  const isItemActive = (item) => pathname.startsWith(item.path);

  return (
    <>
      <nav
        className="theme-module-rail flex w-15 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-3"
        aria-label="Módulos"
      >
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to="/dashboard"
                aria-label="Flow CRM — Início"
                className="mb-3 grid size-9.5 place-items-center rounded-xl border border-primary/30 bg-primary/12 text-primary shadow-xs transition-transform duration-150 hover:scale-[1.03] focus-visible:ring-3 focus-visible:ring-sidebar-ring focus-visible:outline-none"
              >
                <FlowMark />
              </Link>
            }
          />
          <TooltipContent side="right">Flow CRM</TooltipContent>
        </Tooltip>

        <div className="mb-3 h-px w-6 bg-sidebar-border" aria-hidden="true" />

        <div className="flex flex-col items-center gap-1.5">
          {modules.map((entry) => (
            <RailLink key={entry.key} item={entry} isActive={isItemActive(entry)} />
          ))}
        </div>

        <div className="mt-auto flex flex-col items-center gap-1 pt-3">
          <div className="mb-2 h-px w-6 bg-sidebar-border" aria-hidden="true" />

          {/* Core, sem flag: todo usuário logado tem o sino. */}
          <SinoNotificacoes triggerClassName={cn(ITEM_BASE, ITEM_INACTIVE)} />

          {onOpenShortcuts && (
            <Tooltip>
              <TooltipTrigger
                aria-label="Atalhos de teclado (?)"
                className={cn(ITEM_BASE, ITEM_INACTIVE)}
                onClick={onOpenShortcuts}
              >
                <Keyboard className="size-4.5" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent side="right">Atalhos de teclado (?)</TooltipContent>
            </Tooltip>
          )}

          <ThemeToggle className={cn(ITEM_BASE, ITEM_INACTIVE)} side="right" align="end" />

          {UTILITY_ITEMS.map((item) => (
            <RailLink key={item.key} item={item} isActive={isItemActive(item)} />
          ))}

          <Tooltip>
            <TooltipTrigger
              aria-label="Sair da conta"
              className={cn(
                ITEM_BASE,
                ITEM_INACTIVE,
                'hover:bg-destructive/10 hover:text-destructive',
              )}
              onClick={() => setConfirmLogout(true)}
            >
              <LogOut className="size-4.5" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent side="right">Sair da conta</TooltipContent>
          </Tooltip>
        </div>
      </nav>

      <ModalPresence>
        {confirmLogout && (
          <ConfirmationDialog
            title="Sair da conta?"
            description="Sua sessão atual será encerrada neste navegador. Alterações não salvas em formulários abertos serão perdidas."
            confirmLabel="Sair da conta"
            pendingLabel="Saindo…"
            onConfirm={() => logout()}
            onClose={() => setConfirmLogout(false)}
          />
        )}
      </ModalPresence>
    </>
  );
}
