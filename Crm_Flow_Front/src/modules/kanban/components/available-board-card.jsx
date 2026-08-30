import { ArrowUpRight, KanbanSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBoardTypeLabel } from '../lib/board-types';

export function AvailableBoardCard({ board }) {
  return (
    <Link
      className="kb-gallery-card"
      to={`/kanban?quadro=${board.id}`}
      aria-label={`Abrir quadro ${board.nome}`}
    >
      <div className="kb-gallery-card-top">
        <span className="kb-gallery-icon" aria-hidden="true">
          <KanbanSquare size={24} strokeWidth={1.5} />
        </span>
        <span className="kb-gallery-type">{getBoardTypeLabel(board.boardType)}</span>
      </div>
      <h2>{board.nome}</h2>
      <p className="kb-gallery-team">
        <Users size={16} aria-hidden="true" />
        {board.totalParticipantes}{' '}
        {board.totalParticipantes === 1 ? 'participante' : 'participantes'}
      </p>
      <span className="kb-gallery-open">
        Abrir quadro <ArrowUpRight size={18} aria-hidden="true" />
      </span>
    </Link>
  );
}
