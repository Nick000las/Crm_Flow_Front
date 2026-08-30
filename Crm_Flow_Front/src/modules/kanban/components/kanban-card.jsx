import { useState } from 'react';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from './member-avatar';
import {
  AlertOctagon,
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  MessageSquare,
  SlidersHorizontal,
  UserRound,
} from 'lucide-react';
import { formatDueDate, getCardDetails, getDueState, PRIORITIES } from '../lib/card-details';

const COMPACT_SELECT =
  'h-8 w-full appearance-none rounded-md border border-input bg-card dark:bg-surface pl-2.5 pr-7 text-xs text-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-50';

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
  members = [],
  onQuickUpdate,
  onDropTarget,
  onDragStop,
  readOnly = false,
}) {
  const [dragging, setDragging] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const details = getCardDetails(card);
  const due = getDueState(details.prazo, details.prazoConcluido);
  const completed = details.checklist.filter((item) => item.concluido).length;
  const priority = PRIORITIES.find((item) => item.value === details.prioridade);
  const commentsCount = card.commentsCount ?? 0;

  return (
    <article
      className="kb-card group rounded-xl border border-border bg-card p-3.5 shadow-xs transition-all hover:border-border-strong hover:shadow-sm"
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

      {/* Topo: código do card + prioridade */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-medium text-muted-foreground/75">
          #{card.id.slice(0, 6).toUpperCase()}
        </span>
        {priority && priority.value !== 'sem_prioridade' && (
          <span className="kb-priority" data-priority={priority.value}>
            {priority.label}
          </span>
        )}
      </div>

      {/* Etiquetas */}
      {details.etiquetas.length > 0 && (
        <div className="mb-2 flex flex-wrap items-center gap-1" aria-label="Etiquetas">
          {details.etiquetas.map((label) => (
            <span key={label.id} className="kb-label" data-color={label.cor}>
              {label.nome}
            </span>
          ))}
        </div>
      )}

      {/* Título clicável limpo (sem caixa de botão) */}
      <button
        type="button"
        disabled={busy}
        onClick={() => onOpen('details')}
        className="block w-full cursor-pointer text-left text-sm font-semibold leading-snug text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-sm"
      >
        {card.titulo}
      </button>

      {/* Preview da descrição */}
      {details.descricao && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {details.descricao}
        </p>
      )}

      {/* Bloqueio */}
      {details.bloqueio && (
        <div className="mt-2 flex items-start gap-1.5 rounded-md border border-destructive/25 bg-destructive/10 px-2 py-1.5 text-[11px] font-medium text-destructive">
          <AlertOctagon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="line-clamp-2">{details.bloqueio}</span>
        </div>
      )}

      {/* Metadados: prazo e checklist */}
      {(due || details.checklist.length > 0) && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {due && (
            <span className="kb-due" data-state={due.key} title={due.label}>
              <CalendarDays className="h-3 w-3" aria-hidden="true" />
              {formatDueDate(details.prazo)}
            </span>
          )}
          {details.checklist.length > 0 && (
            <span
              className="kb-checklist-count"
              aria-label={`${completed} de ${details.checklist.length} itens concluídos`}
            >
              <CheckSquare className="h-3 w-3" aria-hidden="true" />
              {completed}/{details.checklist.length}
            </span>
          )}
        </div>
      )}

      {/* Rodapé compacto: responsável + comentários + ações rápidas */}
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-2.5">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          {member ? (
            <>
              <MemberAvatar name={member.nome} className="!h-5 !w-5 !flex-none !text-[10px]" />
              <span className="truncate font-medium text-foreground/85">{member.nome}</span>
            </>
          ) : (
            <>
              <UserRound className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden="true" />
              <span className="truncate">Sem responsável</span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            disabled={busy}
            aria-label={`Comentários (${commentsCount})`}
            onClick={() => onOpen('comments')}
            className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tabular-nums">{commentsCount}</span>
          </Button>
          {!readOnly && (
            <Button
              type="button"
              variant={controlsOpen ? 'secondary' : 'ghost'}
              size="icon-xs"
              disabled={busy}
              aria-expanded={controlsOpen}
              aria-label="Ações rápidas e movimentação"
              title="Ações rápidas e mover"
              onClick={() => setControlsOpen((open) => !open)}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Gaveta compacta de ações rápidas e movimentação */}
      {!readOnly && controlsOpen && (
        <div className="mt-2.5 space-y-2.5 border-t border-border/60 pt-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-muted-foreground">
                Responsável
              </label>
              <div className="relative">
                <select
                  disabled={busy}
                  value={card.responsavelId ?? ''}
                  onChange={(event) => onQuickUpdate({ responsavelId: event.target.value || null })}
                  className={COMPACT_SELECT}
                >
                  <option value="">Sem responsável</option>
                  {members.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-muted-foreground">
                Prioridade
              </label>
              <div className="relative">
                <select
                  disabled={busy}
                  value={details.prioridade}
                  onChange={(event) =>
                    onQuickUpdate({ dadosExtras: { prioridade: event.target.value } })
                  }
                  className={COMPACT_SELECT}
                >
                  {PRIORITIES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-muted-foreground">Prazo</label>
              <input
                type="date"
                disabled={busy}
                value={details.prazo}
                onChange={(event) =>
                  onQuickUpdate({ dadosExtras: { prazo: event.target.value || null } })
                }
                className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs text-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:opacity-50 dark:bg-surface"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-muted-foreground">Etapa</label>
              <div className="relative">
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
                  className={COMPACT_SELECT}
                >
                  {columns.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="flex-1"
              disabled={busy || column.cards[0].id === card.id}
              onClick={() => onMove(column.id, column.cards.indexOf(card) - 1)}
            >
              <ArrowUp className="h-3 w-3" aria-hidden="true" />
              Subir
            </Button>
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="flex-1"
              disabled={busy || column.cards.at(-1).id === card.id}
              onClick={() => onMove(column.id, column.cards.indexOf(card) + 1)}
            >
              <ArrowDown className="h-3 w-3" aria-hidden="true" />
              Descer
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
