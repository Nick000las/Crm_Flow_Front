/**
 * @file Organiza a tela de dashboard page, na área de aplicação, e coordena navegação,
 * consultas e ações do usuário.
 */
import { useMemo } from 'react';
import { ArrowRight, Keyboard, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/empty-state';
import { InteractiveCard } from '@/components/motion/interactive-card';
import { StaggerItem, StaggerList } from '@/components/motion/stagger-list';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { isMacPlatform } from '@/lib/keyboard-shortcuts';
import { modulosVisiveis } from '@/lib/modules-registry';

export default function DashboardPage() {
  const { user } = useAuth();
  const modules = useMemo(
    () => modulosVisiveis(user).filter((entry) => entry.key !== 'dashboard'),
    [user],
  );

  const firstName = user?.nome ? String(user.nome).trim().split(/\s+/)[0] : null;
  const greeting = firstName ? `Olá, ${firstName}` : 'Dashboard';
  const shortcutLabel = isMacPlatform() ? '⌘K' : 'Ctrl+K';

  return (
    <div className="space-y-8">
      <PageHeader
        className="theme-dashboard-welcome"
        eyebrow="Visão geral"
        title={greeting}
        description="Acesse rapidamente os módulos ativos e suas principais áreas no Flow CRM."
        actions={
          <span className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-muted-foreground sm:inline-flex">
            <Keyboard className="size-3.5" aria-hidden="true" />
            Busca rápida
            <kbd className="rounded border border-border bg-card px-1.5 py-0.5 text-[10px] font-medium text-foreground">
              {shortcutLabel}
            </kbd>
          </span>
        }
      />

      {modules.length > 0 ? (
        <section
          aria-labelledby="dashboard-modules-heading"
          data-tour="dashboard-modules"
          className="space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id="dashboard-modules-heading"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Módulos e atalhos
            </h2>
            <Badge variant="outline" className="text-[11px] tabular-nums">
              {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
            </Badge>
          </div>

          <StaggerList className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((entry) => {
              const Icon = entry.icon;
              const pages = entry.pages ?? [];

              return (
                <StaggerItem key={entry.key}>
                  <InteractiveCard
                    data-module={entry.key}
                    className="theme-module-card flex h-full flex-col justify-between gap-4 p-5"
                  >
                    <Link
                      to={entry.path}
                      className="group flex items-start justify-between gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <div className="flex items-start gap-3">
                        <div className="theme-module-icon flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold tracking-tight text-foreground group-hover:text-primary">
                            {entry.label}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {entry.subtitle ||
                              `${pages.length} ${pages.length === 1 ? 'área disponível' : 'áreas disponíveis'}`}
                          </p>
                        </div>
                      </div>
                      <ArrowRight
                        className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden="true"
                      />
                    </Link>

                    {pages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t border-border/60 pt-3">
                        {pages.map((page) => {
                          const PageIcon = page.icon;

                          return (
                            <Link
                              key={page.key}
                              to={page.path}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface/80 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                            >
                              {PageIcon && <PageIcon className="size-3.5" aria-hidden="true" />}
                              <span>{page.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </InteractiveCard>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </section>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="Nenhum módulo operacional ativo"
          description="Os módulos liberados para a sua empresa aparecerão aqui assim que forem ativados."
        />
      )}
    </div>
  );
}
