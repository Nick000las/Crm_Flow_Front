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
        'flex w-72 shrink-0 flex-col gap-2 border border-border bg-muted/30 p-2 transition-colors duration-200',
        isOver && 'border-foreground',
      )}
      ref={setNodeRef}
    >
      <header className="grid gap-0.5 px-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="truncate text-sm font-medium">{titulo}</h2>
          {total !== undefined && (
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{total}</span>
          )}
        </div>
        {soma && <p className="font-mono text-xs text-muted-foreground tabular-nums">{soma}</p>}
      </header>

      {cardsQuery.isPending ? (
        <div className="grid gap-2" aria-busy="true">
          <span className="sr-only" role="status">
            Carregando cards de {coluna.nome}…
          </span>
          <Skeleton className="h-20 rounded-none" />
          <Skeleton className="h-20 rounded-none" />
        </div>
      ) : cardsQuery.error ? (
        <ApiErrorAlert error={cardsQuery.error} id={`quadro-coluna-${coluna.ref}-erro`} />
      ) : cards.length === 0 ? (
        <p className="px-1 py-4 text-center text-xs text-muted-foreground">
          {consulta?.filtros ? 'Nenhum card neste filtro.' : 'Nenhum card aqui.'}
        </p>
      ) : (
        <ul className="grid gap-2">
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
          className="rounded-none"
          disabled={cardsQuery.isFetchingNextPage}
          onClick={() => cardsQuery.fetchNextPage()}
          size="sm"
          type="button"
          variant="ghost"
        >
          {cardsQuery.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
        </Button>
      )}

      {onAdicionar && coluna.ativa && (
        <Button
          aria-label={`Adicionar em ${coluna.nome}`}
          className="justify-start rounded-none"
          onClick={onAdicionar}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Plus aria-hidden="true" />
          Adicionar
        </Button>
      )}
    </section>
  );
}
