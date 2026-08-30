/**
 * @file Renderiza app shell, na área de navegação, expondo os estados e eventos necessários à
 * interface.
 */
import { useCallback, useMemo, useState } from 'react';
import { CircleHelp, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { PageTransition } from '@/components/page-transition';
import { SkipLink } from '@/components/skip-link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGlobalShortcuts } from '@/hooks/use-global-shortcuts';
import { useTour } from '@/hooks/use-tour';
import { useAuth } from '@/hooks/useAuth';
import { buildNavigationCommands } from '@/lib/keyboard-shortcuts';
import { findActiveModule, modulosVisiveis, UTILITY_ITEMS } from '@/lib/modules-registry';
import { SinoNotificacoes } from '@/modules/notificacoes/components/sino-notificacoes';
import { PwaStatus } from '@/pwa/pwa-status';

import { CommandPalette, ShortcutsHelpDialog } from './command-palette';
import { ModuleRail } from './module-rail';
import { PageSidebar } from './page-sidebar';

export function AppShell({ children }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { startTour, hasTour } = useTour();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
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
  const startTourAfterOverlay = useCallback(() => {
    setPaletteOpen(false);
    setHelpOpen(false);
    setMobileNavOpen(false);

    window.setTimeout(() => {
      startTour();
    }, 150);
  }, [startTour]);

  useGlobalShortcuts({
    commands,
    activeModule,
    onTogglePalette: togglePalette,
    onOpenHelp: openHelp,
  });

  return (
    <TooltipProvider>
      <div className="app-safe-area flex h-dvh min-h-0 w-full flex-col overflow-hidden bg-background text-foreground">
        <SkipLink />
        <PwaStatus />
        <div className="flex min-h-0 min-w-0 flex-1">
          <ModuleRail
            modules={modules}
            onOpenShortcuts={openHelp}
            onStartTour={hasTour ? startTour : undefined}
            showAccountMenu={!activeModule}
            className="hidden md:flex"
          />
          {activeModule && (
            <PageSidebar
              module={activeModule}
              layoutScope="desktop"
              className="hidden md:flex"
              onOpenPalette={() => setPaletteOpen(true)}
              onOpenShortcuts={openHelp}
              onStartTour={hasTour ? startTourAfterOverlay : undefined}
            />
          )}
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <header className="flex min-h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-surface px-3 md:hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Abrir menu de navegação"
                className="min-w-0 gap-2 text-foreground"
              >
                <Menu className="size-5 shrink-0" aria-hidden="true" />
                <span className="truncate font-medium">{activeModule?.label ?? 'Flow CRM'}</span>
              </Button>
              <div className="flex items-center gap-1">
                {hasTour && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={startTour}
                    aria-label="Iniciar tutorial desta tela"
                    title="Tutorial desta tela"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <CircleHelp className="size-5" aria-hidden="true" />
                  </Button>
                )}
                <SinoNotificacoes side="bottom" />
              </div>
            </header>
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetContent
                side="left"
                className="app-safe-area w-[min(24rem,calc(100vw-1rem))] max-w-none gap-0 overflow-hidden p-0"
              >
                <SheetHeader className="shrink-0 border-b border-sidebar-border px-4 py-4 pr-12">
                  <SheetTitle>Menu do Flow CRM</SheetTitle>
                </SheetHeader>
                <div className="flex min-h-0 min-w-0 flex-1">
                  <ModuleRail
                    modules={modules}
                    layoutScope="mobile"
                    showAccountMenu={!activeModule}
                    onNavigate={() => setMobileNavOpen(false)}
                    onStartTour={hasTour ? startTourAfterOverlay : undefined}
                    onOpenShortcuts={() => {
                      setMobileNavOpen(false);
                      openHelp();
                    }}
                  />
                  {activeModule ? (
                    <PageSidebar
                      module={activeModule}
                      layoutScope="mobile"
                      className="flex min-w-0 w-auto flex-1 border-r-0"
                      onNavigate={() => setMobileNavOpen(false)}
                      onStartTour={hasTour ? startTourAfterOverlay : undefined}
                      onOpenPalette={() => {
                        setMobileNavOpen(false);
                        setPaletteOpen(true);
                      }}
                      onOpenShortcuts={() => {
                        setMobileNavOpen(false);
                        openHelp();
                      }}
                    />
                  ) : (
                    <p className="min-w-0 flex-1 px-4 py-6 text-sm text-muted-foreground">
                      Escolha um módulo ao lado para acessar suas páginas.
                    </p>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <main
              id="conteudo-principal"
              tabIndex={-1}
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain"
            >
              <PageTransition className="flex min-w-0 flex-1 flex-col px-3 py-4 sm:px-6 sm:py-5">
                {children}
              </PageTransition>
            </main>
          </div>
        </div>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={commands}
        onOpenHelp={openHelp}
        onStartTour={hasTour ? startTourAfterOverlay : undefined}
      />
      <ShortcutsHelpDialog
        open={helpOpen}
        onOpenChange={setHelpOpen}
        commands={commands}
        onStartTour={hasTour ? startTourAfterOverlay : undefined}
      />
    </TooltipProvider>
  );
}
