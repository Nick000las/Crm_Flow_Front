import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { PageTransition } from '@/components/page-transition';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { findActiveModule, modulosVisiveis } from '@/lib/modules-registry';
import { ModuleRail } from './module-rail';
import { PageSidebar } from './page-sidebar';

export function AppShell({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  // Único lugar que resolve a navegação visível e o módulo ativo — Rail e
  // Sidebar só consomem.
  const modules = useMemo(() => modulosVisiveis(user), [user]);
  const activeModule = findActiveModule(pathname, modules);

  return (
    <TooltipProvider>
      <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
        <ModuleRail modules={modules} />

        {activeModule && <PageSidebar module={activeModule} className="hidden md:flex" />}

        <main className="min-w-0 flex-1 overflow-y-auto">
          {activeModule && (
            <details key={pathname} className="border-b border-border md:hidden">
              <summary className="cursor-pointer px-6 py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">
                Páginas de {activeModule.label}
              </summary>
              <PageSidebar module={activeModule} className="flex w-full border-r-0" />
            </details>
          )}
          <PageTransition className="mx-auto max-w-6xl px-6 py-8 sm:px-8">
            {children}
          </PageTransition>
        </main>
      </div>
    </TooltipProvider>
  );
}
