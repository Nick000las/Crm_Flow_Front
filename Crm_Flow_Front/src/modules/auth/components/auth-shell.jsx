/**
 * @file Organiza a apresentação e os formulários de autenticação com painel institucional
 * sempre escuro.
 */
import {
  ArrowLeft,
  Bot,
  ContactRound,
  KanbanSquare,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

import { ContentTransition } from '@/components/motion/content-transition';
import { ThemeToggle } from '@/components/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { PwaStatus } from '@/pwa/pwa-status';

const TENANT_MODULES = [
  {
    icon: ContactRound,
    title: 'CRM & Leads',
    description: 'Campos dinâmicos, filtros salvos, atividades e histórico completo.',
  },
  {
    icon: KanbanSquare,
    title: 'Kanban em tempo real',
    description: 'Quadros colaborativos com etapas, responsáveis e controle de versão.',
  },
  {
    icon: Bot,
    title: 'Bots, agenda e automações',
    description: 'Fluxos integrados ao atendimento e às rotinas da operação.',
  },
];

const ADMIN_MODULES = [
  {
    icon: Layers,
    title: 'Gestão de tenants',
    description: 'Criação, identidade, fuso horário e status operacional de cada empresa.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Módulos e feature flags',
    description: 'Contratação por módulo e liberação controlada de funcionalidades.',
  },
  {
    icon: ShieldCheck,
    title: 'Sessão master isolada',
    description: 'Credenciais e cookies separados da operação dos tenants.',
  },
];

function FlowMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-4"
      aria-hidden="true"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 4 8 C 9 8 9 13 14 13 L 20 13" />
      <path d="M 16 9.5 L 20 13 L 16 16.5" />
      <path d="M 4 16 L 10 16 C 13 16 14 18.5 17 18.5" opacity="0.45" />
    </svg>
  );
}

function BrandLockup({ isAdmin }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="grid size-8 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <FlowMark />
      </span>
      <span className="inline-flex items-baseline gap-1 text-base tracking-tight text-foreground">
        <span className="font-semibold">Flow</span>
        <span className="text-xs font-medium tracking-[0.14em] text-primary uppercase">CRM</span>
      </span>
      {isAdmin && (
        <Badge variant="outline" className="bg-card text-[10px] tracking-[0.14em] uppercase">
          master
        </Badge>
      )}
    </div>
  );
}

/**
 * Layout de autenticação alinhado ao tema interno do Flow CRM:
 * superfícies limpas em camadas (`bg-sidebar`, `bg-background`, `bg-card`),
 * bordas sutis e cards funcionais idênticos ao restante da aplicação.
 */
export function AuthShell({
  variant = 'tenant',
  stepKey,
  stepIcon: StepIcon,
  title,
  description,
  email,
  showEmailContext = false,
  onChangeEmail,
  children,
  footer,
}) {
  const isAdmin = variant === 'admin';
  const items = isAdmin ? ADMIN_MODULES : TENANT_MODULES;

  return (
    <>
      <PwaStatus />
      <div className="grid min-h-dvh bg-background text-foreground lg:grid-cols-[0.95fr_1.05fr]">
        {/* Painel lateral com a mesma linguagem de superfície do shell interno */}
        <aside
          aria-label={isAdmin ? 'Apresentação administrativa Flow CRM' : 'Apresentação Flow CRM'}
          className="dark hidden flex-col justify-between border-r border-border bg-surface px-10 py-9 text-foreground lg:flex xl:px-14 xl:py-11"
        >
          <BrandLockup isAdmin={isAdmin} />

          <div className="my-auto max-w-md space-y-6 py-8">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {isAdmin ? 'Administração da plataforma' : 'Ambiente operacional'}
              </p>
              <h2 className="text-2xl leading-snug font-semibold tracking-tight text-foreground">
                {isAdmin
                  ? 'Controle centralizado para cada empresa.'
                  : 'Toda a operação comercial organizada em um só lugar.'}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isAdmin
                  ? 'Gerencie tenants, módulos contratados e liberação de recursos com rastreabilidade.'
                  : 'Acompanhe leads, quadros Kanban em tempo real e automações na mesma interface.'}
              </p>
            </div>

            <ul className="grid gap-2.5">
              {items.map(({ icon: Icon, title: itemTitle, description: itemDescription }) => (
                <li
                  key={itemTitle}
                  className="flex items-start gap-3.5 rounded-xl border border-border bg-surface-elevated/75 p-4 shadow-xs"
                >
                  <span className="mt-0.5 grid size-8.5 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{itemTitle}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      {itemDescription}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
            <span>Sessões isoladas por empresa</span>
            <span>Cookies httpOnly · MFA</span>
          </div>
        </aside>

        {/* Palco de autenticação com card elevado idêntico aos cards internos */}
        <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-5 py-16 sm:px-10">
          <div className="absolute inset-x-5 top-6 flex items-center justify-between sm:inset-x-10">
            <div className="lg:invisible">
              <BrandLockup isAdmin={isAdmin} />
            </div>

            <ThemeToggle side="bottom" align="end" />
          </div>

          <div className="w-full max-w-[26.5rem]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
              <ContentTransition transitionKey={stepKey}>
                <header className="mb-6">
                  {StepIcon && (
                    <div className="mb-4 inline-flex size-9.5 items-center justify-center rounded-lg border border-border bg-surface text-foreground">
                      <StepIcon className="size-4.5" aria-hidden="true" />
                    </div>
                  )}

                  <h1
                    id="login-title"
                    className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
                  >
                    {title}
                  </h1>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>

                  {showEmailContext && email && (
                    <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs">
                      <span className="truncate font-medium text-foreground">{email}</span>
                      {onChangeEmail && (
                        <button
                          type="button"
                          onClick={onChangeEmail}
                          className="inline-flex shrink-0 cursor-pointer items-center gap-1 font-medium text-primary transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-ring"
                        >
                          <ArrowLeft className="size-3" aria-hidden="true" />
                          Trocar
                        </button>
                      )}
                    </div>
                  )}
                </header>

                {children}

                {footer && <div className="mt-6 border-t border-border pt-5">{footer}</div>}
              </ContentTransition>
            </div>
          </div>

          <p className="absolute inset-x-5 bottom-6 text-center text-xs text-muted-foreground lg:hidden">
            Flow CRM · Autenticação segura
          </p>
        </main>
      </div>
    </>
  );
}
