/**
 * @file Casca da área master. Não reusa o `AppShell` do tenant de propósito: aquele depende do
 * `useAuth` e do registry de módulos, e o Rail/Sidebar de dois níveis não descreve esta área —
 * aqui não há módulos, há a plataforma.
 */
import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { ModalPresence } from '@/components/motion/modal-presence';
import { PageTransition } from '@/components/page-transition';
import { SkipLink } from '@/components/skip-link';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { PwaStatus } from '@/pwa/pwa-status';

/**
 * Casca da área master. Não reusa o `AppShell` do tenant de propósito: aquele
 * depende do `useAuth` e do registry de módulos, e o Rail/Sidebar de dois
 * níveis não descreve esta área — aqui não há módulos, há a plataforma.
 */
export function AdminShell({ children }) {
  const { user, logout } = useAdminAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  return (
    <div className="app-safe-area flex min-h-dvh min-w-0 flex-col bg-background text-foreground">
      <SkipLink />
      <PwaStatus />
      <header className="sticky top-0 z-40 flex h-13 shrink-0 items-center justify-between gap-4 border-b border-sidebar-border bg-sidebar/95 px-4 text-sidebar-foreground backdrop-blur-sm sm:px-6">
        <Link
          className="flex items-center gap-2.5 rounded-lg text-sm outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring"
          to="/admin"
        >
          <span className="inline-flex items-baseline gap-1 text-base tracking-tight text-foreground">
            <span className="font-semibold">Flow</span>
            <span className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              CRM
            </span>
          </span>
          <Badge variant="outline" className="text-[10px] tracking-[0.14em] uppercase">
            master
          </Badge>
        </Link>

        <div className="flex items-center gap-2">
          {user?.email && (
            <span className="hidden text-xs text-muted-foreground sm:inline">{user.email}</span>
          )}
          <ThemeToggle side="bottom" align="end" />
          <Button
            size="sm"
            variant="ghost"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={() => setConfirmLogout(true)}
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sair
          </Button>
        </div>
      </header>

      <main id="conteudo-principal" tabIndex={-1} className="flex min-w-0 flex-1 flex-col">
        <PageTransition className="flex min-w-0 flex-1 flex-col px-4 py-5 sm:px-6">
          {children}
        </PageTransition>
      </main>

      <ModalPresence>
        {confirmLogout && (
          <ConfirmationDialog
            title="Sair da área administrativa?"
            description="Sua sessão master será encerrada neste navegador. A sessão do app de tenant, se existir, permanece separada."
            confirmLabel="Sair da conta"
            pendingLabel="Saindo…"
            onConfirm={() => logout()}
            onClose={() => setConfirmLogout(false)}
          />
        )}
      </ModalPresence>
    </div>
  );
}
