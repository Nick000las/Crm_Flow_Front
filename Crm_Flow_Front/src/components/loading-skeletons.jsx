/**
 * @file Kit de skeletons espelhados no layout real e wrapper `AsyncContent` com crossfade suave
 * entre carregamento e dados reais (com anti-flash e suporte a `reducedMotion`).
 */
import { motion, useReducedMotion } from 'motion/react';

import { TRANSITION_FAST } from '@/components/motion/motion-tokens';
import { Skeleton } from '@/components/ui/skeleton';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';
import { cn } from '@/lib/utils';

const CARD_COUNTS = [3, 2, 3, 1];
const COL_WIDTHS = ['w-2/5', 'w-1/4', 'w-1/5', 'w-1/6', 'w-16'];

/**
 * Envolve áreas assíncronas com anti-flash (`delayMs`) no skeleton e entrada suave
 * (`opacity` + micro-deslocamento vertical) quando os dados chegam.
 */
export function AsyncContent({ loading, skeleton, children, className, delayMs = 120 }) {
  const showSkeleton = useDelayedLoading(loading, delayMs);
  const reduceMotion = useReducedMotion();

  if (loading) {
    return showSkeleton ? (
      <div className={className}>{skeleton}</div>
    ) : (
      <div className={cn('min-h-40', className)} aria-busy="true" />
    );
  }

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduceMotion ? { duration: 0 } : TRANSITION_FAST}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Skeleton de quadro Kanban / Pipeline comercial (colunas com cabeçalho, cards e ação inferior). */
export function BoardSkeleton({ columns = 4, label = 'Carregando quadro…' }) {
  return (
    <div
      className="flex min-h-[26rem] items-stretch gap-4 overflow-x-auto pb-4"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: columns }, (_, colIndex) => {
        const cards = CARD_COUNTS[colIndex % CARD_COUNTS.length];

        return (
          <div
            key={colIndex}
            className="flex w-[min(20rem,calc(100vw-3rem))] shrink-0 flex-col rounded-xl border border-border bg-surface p-3.5"
          >
            <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-7 rounded-full" />
            </div>
            <div className="flex flex-1 flex-col gap-2.5 pb-3">
              {Array.from({ length: cards }, (_, cardIndex) => (
                <div
                  key={cardIndex}
                  className="space-y-2.5 rounded-xl border border-border bg-card p-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="h-4 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-4 w-4/5" />
                  {cardIndex % 2 === 0 && <Skeleton className="h-3 w-3/5" />}
                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
                    <div className="flex items-center gap-2">
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-4 w-8" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton className="mt-auto h-8 w-full rounded-lg" />
          </div>
        );
      })}
    </div>
  );
}

/** Skeleton de tabela (Leads, Tenants, relatórios tabulares). */
export function TableSkeleton({ rows = 6, columns = 5, label = 'Carregando registros…' }) {
  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div className="flex items-center gap-4 border-b border-border bg-surface/70 px-4 py-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className={cn('h-3', COL_WIDTHS[index % COL_WIDTHS.length])} />
        ))}
      </div>
      <div className="divide-y divide-border/70">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton
                key={colIndex}
                className={cn('h-3.5', COL_WIDTHS[(colIndex + (rowIndex % 2)) % COL_WIDTHS.length])}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Skeleton de grade de cards (Galeria de quadros, Gerenciar quadros, Dashboard). */
export function CardGridSkeleton({
  cards = 6,
  columnsClass = 'sm:grid-cols-2 lg:grid-cols-3',
  label = 'Carregando itens…',
}) {
  return (
    <div className={cn('grid gap-4', columnsClass)} aria-busy="true" role="status">
      <span className="sr-only">{label}</span>
      {Array.from({ length: cards }, (_, index) => (
        <div
          key={index}
          className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-2xs"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="size-9 rounded-lg" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Skeleton de formulário / seção de configurações ou detalhe. */
export function FormSkeleton({ fields = 4, label = 'Carregando dados…' }) {
  return (
    <div
      className="space-y-5 rounded-xl border border-border bg-card p-6"
      aria-busy="true"
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-3 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/** Skeleton de métricas (KPIs + tabela, usado em Forecast e Relatório do Kanban). */
export function MetricsSkeleton({ stats = 4, rows = 4, label = 'Calculando métricas…' }) {
  return (
    <div className="space-y-5" aria-busy="true" role="status">
      <span className="sr-only">{label}</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: stats }, (_, index) => (
          <div key={index} className="space-y-2 rounded-xl border border-border bg-card p-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-7 w-20" />
          </div>
        ))}
      </div>
      <TableSkeleton rows={rows} columns={4} label={label} />
    </div>
  );
}
