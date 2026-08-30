/**
 * @file Renderiza available board card, na área de Kanban, expondo os estados e eventos
 * necessários à interface.
 */
import { ArrowUpRight, KanbanSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

import { InteractiveCard } from '@/components/motion/interactive-card';
import { Badge } from '@/components/ui/badge';

import { ehQuadroDeEntidade, rotaDoQuadro } from '../lib/board-modo';
import { getBoardTypeLabel } from '../lib/board-types';

export function AvailableBoardCard({ board }) {
  return (
    <Link
      to={rotaDoQuadro(board)}
      aria-label={`Abrir quadro ${board.nome}`}
      className="group block h-full rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <InteractiveCard data-module="kanban" className="theme-module-card flex h-full flex-col p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <span
            className="theme-module-icon grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-foreground transition-colors group-hover:border-primary/40 group-hover:bg-primary/10 group-hover:text-primary"
            aria-hidden="true"
          >
            <KanbanSquare className="size-5" strokeWidth={1.6} />
          </span>
          <Badge variant="secondary" className="font-normal">
            {getBoardTypeLabel(board.boardType)}
          </Badge>
        </div>

        <h2 className="mb-2 text-base font-semibold tracking-tight break-words text-foreground">
          {board.nome}
        </h2>

        {!ehQuadroDeEntidade(board) && (
          <p className="mb-5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="tabular-nums">{board.totalParticipantes}</span>
            <span>{board.totalParticipantes === 1 ? 'participante' : 'participantes'}</span>
          </p>
        )}

        <span className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          <span>Abrir quadro</span>
          <ArrowUpRight className="size-4 transition-colors duration-150" aria-hidden="true" />
        </span>
      </InteractiveCard>
    </Link>
  );
}
