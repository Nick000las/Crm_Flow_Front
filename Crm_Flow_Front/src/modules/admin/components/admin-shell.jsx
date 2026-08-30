import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAdminAuth } from '@/hooks/use-admin-auth';

/**
 * Casca da área master. Não reusa o `AppShell` do tenant de propósito: aquele
 * depende do `useAuth` e do registry de módulos, e o Rail/Sidebar de dois
 * níveis não descreve esta área — aqui não há módulos, há a plataforma.
 *
 * A faixa escura no topo é o único sinal forte da tela. Ela reaproveita o
 * mesmo quase-preto que o Rail já usa para navegação, então diz "você não está
 * no app de um tenant" sem introduzir cor nova.
 */
export function AdminShell({ children }) {
  const { user, logout } = useAdminAuth();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-border bg-foreground px-4 text-background sm:px-6">
        <Link
          className="flex items-center gap-2.5 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-background/70"
          to="/admin"
        >
          <span
            className="grid size-6 place-items-center rounded-sm bg-background text-[11px] font-bold text-foreground"
            aria-hidden="true"
          >
            F
          </span>
          <span>Flow CRM</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-background/70">
            master
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user?.email && (
            <span className="hidden font-mono text-xs text-background/70 sm:inline">
              {user.email}
            </span>
          )}
          <Button
            className="h-7 text-background hover:bg-background/10 hover:text-background focus-visible:ring-background/70"
            size="sm"
            variant="ghost"
            onClick={logout}
          >
            Sair
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">{children}</div>
      </main>
    </div>
  );
}
