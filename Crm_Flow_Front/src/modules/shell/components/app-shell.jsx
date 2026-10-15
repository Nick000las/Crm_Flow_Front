import { useLocation } from 'react-router-dom';
import { useMemo } from 'react';
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
