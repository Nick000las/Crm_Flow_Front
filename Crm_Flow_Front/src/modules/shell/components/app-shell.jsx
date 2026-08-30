import { Menu } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PageTransition } from '@/components/page-transition';
import { SkipLink } from '@/components/skip-link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { buildNavigationCommands } from '@/lib/keyboard-shortcuts';
import { findActiveModule, modulosVisiveis, UTILITY_ITEMS } from '@/lib/modules-registry';
import { CommandPalette, ShortcutsHelpDialog } from './command-palette';
import { ModuleRail } from './module-rail';
import { PageSidebar } from './page-sidebar';

export function AppShell({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  // Único lugar que resolve a navegação visível e o módulo ativo — Rail,
  // Sidebar e atalhos de teclado só consomem.
  const modules = useMemo(() => modulosVisiveis(user), [user]);
  const activeModule = findActiveModule(pathname, modules);
  const commands = useMemo(() => buildNavigationCommands(modules, UTILITY_ITEMS), [modules]);

  const togglePalette = useCallback(() => {
    setHelpOpen(false);
    setPaletteOpen((current) => !current);
  }, []);

  const openHelp = useCallback(() => {
    setPaletteOpen(false);
    setHelpOpen(true);
  }, []);

  useGlobalShortcuts({
    commands,
    activeModule,
    onTogglePalette: togglePalette,
    onOpenHelp: openHelp,
  });

  return (
    <TooltipProvider>
      <div className="flex h-svh w-full overflow-hidden bg-background text-foreground">
        <SkipLink />
        <ModuleRail modules={modules} onOpenShortcuts={openHelp} />

        {activeModule && (
          <PageSidebar
            module={activeModule}
            layoutScope="desktop"
            className="hidden md:flex"
            onOpenPalette={() => setPaletteOpen(true)}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {activeModule && (
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface/80 px-4 backdrop-blur-xs md:hidden">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMobileNavOpen(true)}
                aria-label={`Abrir páginas de ${activeModule.label}`}
                className="gap-2 text-foreground"
              >
                <Menu className="size-4" aria-hidden="true" />
                <span className="font-medium">{activeModule.label}</span>
              </Button>

              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>{activeModule.label}</SheetTitle>
                  </SheetHeader>
                  <PageSidebar
                    module={activeModule}
                    layoutScope="mobile"
                    className="flex w-full flex-1 border-r-0 bg-transparent"
                    onNavigate={() => setMobileNavOpen(false)}
                    onOpenPalette={() => {
                      setMobileNavOpen(false);
                      setPaletteOpen(true);
                    }}
                  />
                </SheetContent>
              </Sheet>
            </header>
          )}

          <main id="conteudo-principal" tabIndex={-1} className="min-w-0 flex-1 overflow-y-auto">
            <PageTransition className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
              {children}
            </PageTransition>
          </main>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={commands}
        onOpenHelp={openHelp}
      />

      <ShortcutsHelpDialog open={helpOpen} onOpenChange={setHelpOpen} commands={commands} />
    </TooltipProvider>
  );
}
