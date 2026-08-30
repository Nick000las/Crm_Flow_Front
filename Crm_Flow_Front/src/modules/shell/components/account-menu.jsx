/**
 * @file Menu centralizado da conta do usuário (preferências, tema, atalhos e logout).
 */
import { useState } from 'react';
import { Keyboard, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { ModalPresence } from '@/components/motion/modal-presence';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: Monitor },
];

export function AccountMenu({
  trigger,
  side = 'top',
  align = 'start',
  onNavigate,
  onOpenShortcuts,
}) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [confirmLogout, setConfirmLogout] = useState(false);

  if (!user) {
    return null;
  }

  const displayName = user.nome || user.email || 'Conta';
  const roleLabel = user.role ? String(user.role).toLowerCase() : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={trigger} />
        <DropdownMenuContent
          side={side}
          align={align}
          sideOffset={8}
          className="w-64 rounded-xl border border-border bg-popover p-1.5 shadow-lg"
        >
          {/* Cabeçalho com resumo da conta */}
          <div className="flex items-start justify-between gap-2 px-2.5 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
              {user.email && user.email !== displayName && (
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              )}
            </div>
            {roleLabel && (
              <span className="shrink-0 rounded-md border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                {roleLabel}
              </span>
            )}
          </div>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            className="gap-2.5 rounded-lg px-2.5 py-2"
            onClick={() => {
              navigate('/configuracoes');
              onNavigate?.();
            }}
          >
            <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>Configurações e segurança</span>
          </DropdownMenuItem>

          {onOpenShortcuts && (
            <DropdownMenuItem
              className="justify-between gap-2.5 rounded-lg px-2.5 py-2"
              onClick={() => {
                onNavigate?.();
                onOpenShortcuts();
              }}
            >
              <span className="flex items-center gap-2.5">
                <Keyboard className="size-4 text-muted-foreground" aria-hidden="true" />
                <span>Atalhos de teclado</span>
              </span>
              <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface px-1 text-[10px] font-medium text-muted-foreground">
                ?
              </kbd>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator className="my-1" />

          {/* Seletor rápido de tema */}
          <div className="px-2 py-1.5">
            <p className="mb-1.5 px-0.5 text-[11px] font-medium text-muted-foreground">Aparência</p>
            <div
              role="radiogroup"
              aria-label="Tema da interface"
              className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface/70 p-0.5"
            >
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
                const active = theme === value;

                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex cursor-pointer items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors',
                      active
                        ? 'bg-card text-foreground shadow-2xs ring-1 ring-border'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <DropdownMenuSeparator className="my-1" />

          <DropdownMenuItem
            variant="destructive"
            className="gap-2.5 rounded-lg px-2.5 py-2"
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span>Sair da conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
