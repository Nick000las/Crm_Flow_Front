import { useState } from 'react';
import { LoadingState } from '@/components/loading-state';
import { CalendarDays, CheckSquare, ChevronDown, UserRound } from 'lucide-react';
import { formatDueDate, getCardDetails, getDueState, PRIORITIES } from '../lib/card-details';

export function KanbanCard({
  card,
  column,
  columns,
  member,
  busy,
  moving = false,
  draggable,
  onOpen,
  onMove,
  onDropTarget,
  onDragStop,
  readOnly = false,
}) {
  const [dragging, setDragging] = useState(false);
  const details = getCardDetails(card);
  const due = getDueState(details.prazo, details.prazoConcluido);
  const completed = details.checklist.filter((item) => item.concluido).length;
  const priority = PRIORITIES.find((item) => item.value === details.prioridade);
  return (
    <article
      className="kb-card"
      aria-busy={moving}
      data-dragging={dragging}
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData('text/plain', card.id);
        setDragging(true);
      }}
      onDragEnd={() => {
        setDragging(false);
        onDragStop?.();
      }}
      onDragOver={(event) => {
        if (draggable) {
          event.preventDefault();
          event.stopPropagation();
          const bounds = event.currentTarget.getBoundingClientRect();
          onDropTarget(
            card.id,
            event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after',
          );
        }
      }}
    >
      {moving && <LoadingState inline label="Movendo card…" className="mb-2" />}
      <div className="kb-card-identity">#{card.id.slice(0, 6).toUpperCase()}</div>
      {details.etiquetas.length > 0 && (
        <div className="kb-card-labels" aria-label="Etiquetas">
          {details.etiquetas.map((label) => (
            <span key={label.id} className="kb-label" data-color={label.cor}>
              {label.nome}
            </span>
          ))}
        </div>
      )}
      <button className="kb-card-title" disabled={busy} onClick={onOpen}>
        {card.titulo}
      </button>
      {details.descricao && <p className="kb-card-description">{details.descricao}</p>}
      <div className="kb-card-meta">
        {priority.value !== 'sem_prioridade' && (
          <span className="kb-priority" data-priority={priority.value}>
            Prioridade {priority.label.toLocaleLowerCase('pt-BR')}
          </span>
        )}
        {due && (
          <span className="kb-due" data-state={due.key} title={due.label}>
            <CalendarDays size={13} aria-hidden="true" />
            {formatDueDate(details.prazo)} · {due.label}
          </span>
        )}
        {details.checklist.length > 0 && (
          <span
            className="kb-checklist-count"
            aria-label={`${completed} de ${details.checklist.length} itens concluídos`}
          >
            <CheckSquare size={13} aria-hidden="true" />
            {completed}/{details.checklist.length}
          </span>
        )}
      </div>
      <div className="kb-card-assignee">
        <UserRound size={14} aria-hidden="true" />
        {member?.nome || 'Sem responsável'}
      </div>
      {!readOnly && (
        <details className="kb-card-movement">
          <summary>
            <ChevronDown size={13} aria-hidden="true" /> Mover card
          </summary>
          <label className="kb-move">
            Etapa
            <select
              aria-label={`Mover ${card.titulo}`}
              disabled={busy}
              value={column.id}
              onChange={(event) =>
                onMove(
                  event.target.value,
                  columns.find((item) => item.id === event.target.value).cards.length,
                )
              }
            >
              {columns.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </select>
          </label>
          <div className="kb-actions">
            <button
              disabled={busy || column.cards[0].id === card.id}
              onClick={() => onMove(column.id, column.cards.indexOf(card) - 1)}
            >
              Subir
            </button>
            <button
              disabled={busy || column.cards.at(-1).id === card.id}
              onClick={() => onMove(column.id, column.cards.indexOf(card) + 1)}
            >
              Descer
            </button>
          </div>
        </details>
      )}
    </article>
  );
}
