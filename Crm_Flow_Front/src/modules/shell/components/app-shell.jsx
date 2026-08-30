import { PageTransition } from '@/components/page-transition';
import { useLocation } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { findActiveModule } from '@/lib/modules-registry';
import { ModuleRail } from './module-rail';
import { PageSidebar } from './page-sidebar';

export function AppShell({ children }) {
  const { pathname } = useLocation();
  // Único lugar que resolve o módulo ativo — Rail e Sidebar só consomem.
  const activeModule = findActiveModule(pathname);

  return (
    <TooltipProvider>
      <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
        <ModuleRail />

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
