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

        {activeModule && (
          <PageSidebar module={activeModule} className="hidden md:flex" />
        )}

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-6 py-8 sm:px-8">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}
