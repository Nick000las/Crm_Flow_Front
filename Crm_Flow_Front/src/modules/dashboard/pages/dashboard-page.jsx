import { ArrowRight, Sparkles } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { InteractiveCard } from '@/components/motion/interactive-card';
import { StaggerItem, StaggerList } from '@/components/motion/stagger-list';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { modulosVisiveis } from '@/lib/modules-registry';

export default function DashboardPage() {
  const { user } = useAuth();
  const modules = useMemo(
    () => modulosVisiveis(user).filter((entry) => entry.key !== 'dashboard'),
    [user],
  );

  const firstName = user?.nome ? String(user.nome).trim().split(/\s+/)[0] : null;
  const greeting = firstName ? `Olá, ${firstName}` : 'Dashboard';

  return (
    <div className="space-y-8">
      <PageHeader
        className="theme-dashboard-welcome"
        eyebrow="Visão geral"
        title={greeting}
        description="Acesse rapidamente os módulos ativos da sua operação no Flow CRM."
      />

      {modules.length > 0 ? (
        <section aria-labelledby="dashboard-modules-heading" className="space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <h2
              id="dashboard-modules-heading"
              className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
            >
              Módulos disponíveis
            </h2>
            <Badge variant="outline" className="text-[11px] tabular-nums">
              {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}
            </Badge>
          </div>

          <StaggerList className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((entry) => {
              const Icon = entry.icon;
              const pageCount = entry.pages?.length ?? 0;

              return (
                <StaggerItem key={entry.key}>
                  <Link
                    to={entry.path}
                    className="group block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <InteractiveCard
                      data-module={entry.key}
                      className="theme-module-card flex h-full flex-col justify-between gap-4 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="theme-module-icon flex size-10 items-center justify-center rounded-lg border border-border bg-surface text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary">
                          <Icon className="size-4.5" aria-hidden="true" />
                        </div>
                        <ArrowRight
                          className="size-4 text-muted-foreground transition-colors duration-150 group-hover:text-foreground"
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold tracking-tight text-foreground">
                          {entry.label}
                        </h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {pageCount > 0
                            ? `${pageCount} ${pageCount === 1 ? 'área disponível' : 'áreas disponíveis'}`
                            : 'Acessar módulo'}
                        </p>
                      </div>
                    </InteractiveCard>
                  </Link>
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
