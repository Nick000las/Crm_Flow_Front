/**
 * @file Uma coluna, com a própria paginação. Coluna `ativa: false` é um status desativado que
 * ainda tem cards: aparece, mas não recebe nenhum. Cada coluna custa duas requisições, então a
 * que está fora da tela espera aparecer.
 */
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useVisivelUmaVez } from '@/hooks/use-visivel-uma-vez';
import { cn } from '@/lib/utils';

import { useCardsDaColuna, useResumoDaColuna } from '../../hooks/use-quadro';
import { cardsDasPaginas, colunasDeDestino, somaDoResumo } from '../../lib/quadro';
import { CardQuadro } from './card-quadro';

/**
 * Uma coluna, com a própria paginação. Coluna `ativa: false` é um status
 * desativado que ainda tem cards: aparece, mas não recebe nenhum. Cada coluna
 * custa duas requisições, então a que está fora da tela espera aparecer.
 *
 * @param {{
 *   quadroRef: string,
 *   coluna: import('../../api/quadro.api').ColunaQuadro,
 *   colunas: import('../../api/quadro.api').ColunaQuadro[],
 *   campos: import('../../types').Campo[],
 *   nomePorId: Map<string, string>,
 *   consulta: import('../../lib/quadro-consulta').ConsultaDoQuadro | null,
 *   onAbrir: (card: import('../../api/quadro.api').CardQuadro) => void,
 *   onMover: (
 *     card: import('../../api/quadro.api').CardQuadro,
 *     de: string,
 *     para: import('../../api/quadro.api').ColunaQuadro,
 *   ) => void,
 *   onAdicionar?: () => void,
 * }} props `onAdicionar` ausente = sem o botão; `consulta: null` = ainda não dá para buscar
 */
export function ColunaQuadro({
  quadroRef,
  coluna,
  colunas,
  campos,
  nomePorId,
  consulta,
  onAbrir,
  onMover,
  onAdicionar,
}) {
  const { isOver, node, setNodeRef } = useDroppable({
    id: coluna.ref,
    data: { coluna },
    disabled: !coluna.ativa,
  });
  const visivel = useVisivelUmaVez(node);
  const cardsQuery = useCardsDaColuna(quadroRef, coluna.ref, consulta, visivel);
  const resumoQuery = useResumoDaColuna(quadroRef, coluna.ref, consulta, visivel);
  const cards = cardsDasPaginas(cardsQuery.data);
  const destinos = colunasDeDestino(colunas, coluna.ref);
  const soma = somaDoResumo(resumoQuery.data);
  const total = resumoQuery.data?.total;
  const titulo = coluna.ativa ? coluna.nome : `${coluna.nome} (desativado)`;

  return (
    <section
      aria-label={coluna.nome}
      className={cn(
        'flex w-[min(20rem,calc(100vw-3rem))] shrink-0 flex-col rounded-xl border border-border bg-surface p-3.5 transition-colors duration-150',
        isOver && 'border-primary bg-primary/5 ring-2 ring-primary/20',
      )}
      ref={setNodeRef}
    >
      <header className="mb-3 space-y-2 border-b border-border/60 pb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold tracking-tight text-foreground">
            {titulo}
          </h2>
          {total !== undefined && (
            <span className="inline-flex shrink-0 items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
              {total}
            </span>
          )}
        </div>
        {soma && (
          <p className="inline-flex items-center rounded-md border border-border/70 bg-card/70 px-2 py-0.5 text-xs font-medium text-foreground/85 tabular-nums">
            {soma}
          </p>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-2.5 pb-3">
        {cardsQuery.isPending ? (
          <div className="grid gap-2.5" aria-busy="true">
            <span className="sr-only" role="status">
              Carregando cards de {coluna.nome}…
            </span>
            <Skeleton className="h-24 rounded-xl" />
            <Skeleton className="h-24 rounded-xl" />
          </div>
        ) : cardsQuery.error ? (
          <ApiErrorAlert error={cardsQuery.error} id={`quadro-coluna-${coluna.ref}-erro`} />
        ) : cards.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/30 px-3 py-8 text-center text-xs text-muted-foreground">
            {consulta?.filtros ? 'Nenhum card neste filtro.' : 'Nenhum card nesta etapa.'}
          </div>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {cards.map((card) => (
              <CardQuadro
                campos={campos}
                card={card}
                colunaRef={coluna.ref}
                destinos={destinos}
                key={card.entidadeId}
                nomePorId={nomePorId}
                onAbrir={() => onAbrir(card)}
                onMover={(para) => onMover(card, coluna.ref, para)}
              />
            ))}
          </ul>
        )}

        {cardsQuery.hasNextPage && (
          <Button
            aria-busy={cardsQuery.isFetchingNextPage}
            className="w-full"
            disabled={cardsQuery.isFetchingNextPage}
            onClick={() => cardsQuery.fetchNextPage()}
            size="xs"
            type="button"
            variant="outline"
            loading={cardsQuery.isFetchingNextPage}
            loadingText="Carregando…"
          >
            Carregar mais
          </Button>
        )}
      </div>

      {onAdicionar && coluna.ativa && (
        <Button
          aria-label={`Adicionar em ${coluna.nome}`}
          className="mt-auto w-full justify-center border-dashed border-border/90 bg-card/60 text-muted-foreground hover:border-border-strong hover:bg-accent hover:text-foreground"
          onClick={onAdicionar}
          size="sm"
          type="button"
          variant="outline"
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar
        </Button>
      )}
    </section>
  );
}
