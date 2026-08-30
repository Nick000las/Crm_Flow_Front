import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/loading-state';
import { Spinner } from '@/components/ui/spinner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useKanbanEvents } from '../hooks/use-kanban-events';
import { CardEditor } from '../components/card-editor';
import { KanbanCard } from '../components/kanban-card';
import { BoardFilters } from '../components/board-filters';
import { BoardArchives } from '../components/board-archives';
import { EmailPreferences } from '../components/email-preferences';
import { getCardDetails, getDueState } from '../lib/card-details';
import { EditorDialog } from '../components/editor-dialog';
import { Plus, Pencil, Trash2, ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { PageHeader } from '@/components/page-header';
import { getBoardTypeLabel } from '../lib/board-types';
import './kanban.css';

export default function KanbanPage({ boardId }) {
  const { authApi, user } = useAuth();
  const [loadedBoard, setBoard] = useState(null);
  const board = loadedBoard?.id === boardId ? loadedBoard : null;
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [pendingOperation, setPendingOperation] = useState(null);
  const busy = pendingOperation !== null;
  const [boardRequests, setBoardRequests] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [comments, setComments] = useState([]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dueFilter, setDueFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const requestVersion = useRef(0);
  const canManage = ['DONO', 'MASTER'].includes(user?.role);
  const canEdit = board?.canEdit !== false;
  const members = board?.participantes?.filter((member) => member.ativo) ?? [];
  const reload = useCallback(
    async ({ clearError = true } = {}) => {
      if (!boardId) {
        setBoard(null);
        return;
      }
      const version = ++requestVersion.current;
      setBoardRequests((count) => count + 1);
      try {
        const result = await authApi.get(`/kanban/boards/${boardId}`);
        if (version === requestVersion.current) {
          setBoard(result);
          if (clearError) {
            setError('');
          }
        }
      } catch (error) {
        if (error.status === 404 && version === requestVersion.current) {
          setBoard(null);
        }
        throw error;
      } finally {
        setBoardRequests((count) => count - 1);
      }
    },
    [authApi, boardId],
  );
  useEffect(() => {
    if (!boardId) {
      return;
    }
    let active = true;
    const version = ++requestVersion.current;
    authApi
      .get(`/kanban/boards/${boardId}`)
      .then((result) => {
        if (active && version === requestVersion.current) {
          setBoard(result);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [authApi, boardId]);
  const pendingSync = useRef(false);
  const commentsVersion = useRef(0);
  const loadComments = useCallback(
    async (cardId) => {
      const version = ++commentsVersion.current;
      setCommentsLoading(true);
      setCommentsError('');
      try {
        const rows = await authApi.get(`/kanban/cards/${cardId}/comments`);
        if (version === commentsVersion.current) {
          setComments(rows);
        }
      } catch (error) {
        if (version === commentsVersion.current) {
          setCommentsError(error.message);
        }
        throw error;
      } finally {
        if (version === commentsVersion.current) {
          setCommentsLoading(false);
        }
      }
    },
    [authApi],
  );
  const synchronize = useCallback(async () => {
    await Promise.all([
      reload(),
      editor?.kind === 'card' && editor.id ? loadComments(editor.id) : Promise.resolve(),
    ]);
  }, [reload, editor, loadComments]);

  useKanbanEvents(
    (event) => {
      if (event.type === 'access.revoked' || event.type === 'board.delete') {
        requestVersion.current++;
        commentsVersion.current++;
        pendingSync.current = false;
        setBoard(null);
        setEditor(null);
        setDeleting(null);
        setArchiveOpen(false);
        setError(
          event.type === 'board.delete'
            ? 'Este quadro foi excluído.'
            : 'Você não participa mais deste quadro.',
        );
        return;
      }
      if (event.type === 'card.delete' && event.cardId === deleting?.id) {
        setDeleting(null);
      }
      if (['card.delete', 'card.archive'].includes(event.type) && event.cardId === editor?.id) {
        setEditor(null);
        setDeleting(null);
        commentsVersion.current++;
        if (event.actorId !== user?.id) {
          setNotice(
            event.type === 'card.archive'
              ? 'Este card foi arquivado por outra pessoa.'
              : 'Este card foi excluído por outra pessoa.',
          );
        }
        if (busy) {
          pendingSync.current = true;
        } else {
          reload().catch((error) => setError(error.message));
        }
        return;
      }
      if (event.conflito && event.actorId !== user?.id) {
        setNotice(
          'Houve uma movimentação concorrente neste quadro. O estado atual foi sincronizado.',
        );
      }
      if (busy) {
        pendingSync.current = true;
        return;
      }
      synchronize().catch((error) => setError(error.message));
    },
    { boardId, ...(editor?.kind === 'card' && editor.id && { cardId: editor.id }) },
  );

  useEffect(() => {
    if (busy || !pendingSync.current) {
      return;
    }
    let active = true;
    Promise.resolve()
      .then(() => {
        if (active) {
          pendingSync.current = false;
          return synchronize();
        }
      })
      .catch((error) => {
        if (active) {
          setError(error.message);
        }
      });
    return () => {
      active = false;
    };
  }, [busy, synchronize]);

  async function run(operation, scope = 'board.refresh') {
    requestVersion.current++;
    setPendingOperation(scope);
    setError('');
    setNotice('');
    try {
      await operation();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setPendingOperation(null);
    }
  }
  async function openCard(card) {
    setEditor({ kind: 'card', ...card });
    setComments([]);
    setError('');
    await loadComments(card.id).catch(() => {});
  }
  async function move(card, columnId, position) {
    if (busy) {
      return;
    }
    const previous = board;
    const next = {
      ...board,
      colunas: board.colunas.map((c) => ({ ...c, cards: c.cards.filter((k) => k.id !== card.id) })),
    };
    next.colunas
      .find((c) => c.id === columnId)
      .cards.splice(position, 0, { ...card, colunaId: columnId });
    setBoard(next);
    await run(async () => {
      try {
        const moved = await authApi.patch(`/kanban/cards/${card.id}/mover`, {
          novaColunaId: columnId,
          novaOrdem: position,
          ...(card.updatedAt ? { expectedUpdatedAt: card.updatedAt } : {}),
        });
        if (moved.conflito) {
          setNotice('Este card foi alterado por outra pessoa. Sua movimentação foi salva.');
        }
      } catch (e) {
        setBoard(previous);
        throw e;
      }
      await reload();
    }, `card.move:${card.id}`);
  }
  async function saveColumn(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = {
      nome: form.get('nome'),
      wipLimit: form.get('wipLimit') ? Number(form.get('wipLimit')) : null,
    };
    await run(async () => {
      if (editor.id) {
        await authApi.patch(`/kanban/colunas/${editor.id}`, data);
      } else {
        await authApi.post(`/kanban/boards/${boardId}/colunas`, data);
      }
      setEditor(null);
      await reload();
    }, 'column.save');
  }
  async function saveCard(payload) {
    let saved = false;
    await run(async () => {
      if (editor.id) {
        await authApi.patch(`/kanban/cards/${editor.id}`, payload);
      } else {
        await authApi.post(`/kanban/boards/${boardId}/cards`, {
          ...payload,
          colunaId: editor.colunaId,
        });
      }
      // Depois da confirmação da API, uma falha ao recarregar não deve permitir
      // reenviar a criação e duplicar o card.
      saved = true;
      setEditor(null);
      await reload();
    }, 'card.save');
    if (!saved) {
      // Revalida também quando a API detecta versão antiga antes do socket chegar.
      reload({ clearError: false }).catch((error) => setError(error.message));
    }
  }
  function matchesFilters(card) {
    const details = getCardDetails(card);
    const searchable = [
      card.titulo,
      details.descricao,
      ...details.etiquetas.map((label) => label.nome),
    ]
      .join(' ')
      .toLocaleLowerCase('pt-BR');
    return (
      searchable.includes(query.trim().toLocaleLowerCase('pt-BR')) &&
      (!priorityFilter || details.prioridade === priorityFilter) &&
      (!assigneeFilter ||
        (assigneeFilter === 'unassigned'
          ? !card.responsavelId
          : card.responsavelId === assigneeFilter)) &&
      (!dueFilter ||
        (dueFilter === 'none'
          ? !details.prazo
          : getDueState(details.prazo, details.prazoConcluido)?.key === dueFilter))
    );
  }
  const filtered = Boolean(query || priorityFilter || dueFilter || assigneeFilter);
  async function remove() {
    return run(async () => {
      await authApi.delete(deleting.path);
      // A exclusão já foi confirmada. Uma falha na leitura seguinte não deve
      // oferecer repetir uma mutação que já terminou.
      setDeleting(null);
      if (deleting.kind === 'comment') {
        await loadComments(editor.id);
      } else {
        if (deleting.kind === 'card') {
          setEditor(null);
          commentsVersion.current++;
        }
        await reload();
      }
    }, `${deleting.kind}.delete`);
  }
  function requestDeletion(target) {
    setError('');
    setDeleting(target);
  }
  async function reorderColumn(index, offset) {
    const ids = board.colunas.map((c) => c.id);
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    await run(async () => {
      await authApi.patch(`/kanban/boards/${boardId}/colunas/reordenar`, { ids });
      await reload();
    }, `column.move:${board.colunas[index].id}`);
  }
  return (
    <>
      <PageHeader
        title={board?.nome ?? 'Quadro Kanban'}
        description="Acompanhe as etapas e organize o trabalho da equipe."
      />
      <Link className="kb-back-link" to="/kanban">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar aos quadros
      </Link>
      <div className="kb-toolbar kb-board-actions">
        <Button
          variant="outline"
          disabled={busy || loading}
          loading={boardRequests > 0 || pendingOperation === 'board.refresh'}
          loadingText="Atualizando quadro…"
          onClick={() => run(reload)}
        >
          Atualizar
        </Button>
        {board && canManage && (
          <Button variant="outline" disabled={busy} onClick={() => setEditor({ kind: 'column' })}>
            <Plus size={16} /> Coluna
          </Button>
        )}
        {board && (
          <Button variant="outline" disabled={busy} onClick={() => setArchiveOpen(true)}>
            Arquivados
          </Button>
        )}
        <Button variant="outline" onClick={() => setEmailOpen(true)}>
          E-mails
        </Button>
        {board && !canEdit && <span className="kb-hint">Acesso somente para leitura</span>}
      </div>
      {board && (
        <BoardFilters
          key={`${user?.id}:${boardId}`}
          boardId={boardId}
          userId={user?.id}
          members={members}
          value={{ query, priority: priorityFilter, due: dueFilter, assignee: assigneeFilter }}
          onChange={(value) => {
            setQuery(value.query);
            setPriorityFilter(value.priority);
            setDueFilter(value.due);
            setAssigneeFilter(value.assignee);
          }}
          total={board.colunas.reduce((count, column) => count + column.cards.length, 0)}
          visible={board.colunas.reduce(
            (count, column) => count + column.cards.filter(matchesFilters).length,
            0,
          )}
        />
      )}
      {archiveOpen && (
        <BoardArchives
          boardId={boardId}
          authApi={authApi}
          canEdit={canEdit}
          onClose={() => setArchiveOpen(false)}
          onRestored={reload}
        />
      )}
      {emailOpen && <EmailPreferences authApi={authApi} onClose={() => setEmailOpen(false)} />}
      {error && (
        <p role="alert" className="kb-error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <LoadingState label="Carregando quadro…" />
      ) : !board ? (
        <div className="kb-empty">
          <h2>Quadro indisponível</h2>
          <p>Volte à lista de quadros ou tente atualizar esta página.</p>
        </div>
      ) : (
        <>
          <p className="kb-hint">
            {getBoardTypeLabel(board.boardType)} · Arraste os cards ou use os controles de posição
            dentro de cada card.
          </p>
          <div className="kb-board">
            {board.colunas.map((column, index) => (
              <section
                key={column.id}
                className="kb-column"
                aria-busy={pendingOperation === `column.move:${column.id}`}
                aria-label={column.nome}
                data-wip-exceeded={
                  column.wipLimit && column.cards.length > column.wipLimit ? true : undefined
                }
                data-drop-end={dropTarget?.columnId === column.id && !dropTarget.cardId}
                onDragOver={(e) => {
                  if (canEdit && !busy && !filtered) {
                    e.preventDefault();
                    setDropTarget({ columnId: column.id });
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!canEdit || busy || filtered) {
                    return;
                  }
                  const id = e.dataTransfer.getData('text/plain');
                  const card = board.colunas.flatMap((c) => c.cards).find((c) => c.id === id);
                  if (card) {
                    const targetCards = column.cards.filter((c) => c.id !== id);
                    const targetIndex =
                      dropTarget?.columnId === column.id && dropTarget.cardId
                        ? targetCards.findIndex((item) => item.id === dropTarget.cardId)
                        : -1;
                    const position =
                      targetIndex < 0
                        ? targetCards.length
                        : targetIndex + (dropTarget.side === 'after' ? 1 : 0);
                    if (dropTarget?.cardId !== id) {
                      move(card, column.id, position);
                    }
                    setDropTarget(null);
                  }
                }}
              >
                <header>
                  <h2>
                    {column.nome}{' '}
                    <span>
                      {column.cards.length}
                      {column.wipLimit ? ` / ${column.wipLimit}` : ''}
                    </span>
                    {pendingOperation === `column.move:${column.id}` && (
                      <Spinner className="ml-2 inline-block" />
                    )}
                  </h2>
                  {canManage && (
                    <div className="kb-actions">
                      <button
                        aria-label="Mover coluna para esquerda"
                        disabled={busy || index === 0}
                        onClick={() => reorderColumn(index, -1)}
                      >
                        <ArrowLeft size={14} />
                      </button>
                      <button
                        aria-label="Mover coluna para direita"
                        disabled={busy || index === board.colunas.length - 1}
                        onClick={() => reorderColumn(index, 1)}
                      >
                        <ArrowRight size={14} />
                      </button>
                      <button
                        aria-label={`Editar ${column.nome}`}
                        disabled={busy}
                        onClick={() => setEditor({ kind: 'column', ...column })}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="kb-button-danger"
                        aria-label={`Excluir ${column.nome}`}
                        disabled={busy}
                        onClick={() =>
                          requestDeletion({
                            kind: 'column',
                            id: column.id,
                            path: `/kanban/colunas/${column.id}`,
                            name: column.nome,
                          })
                        }
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </header>
                {column.wipLimit && column.cards.length >= column.wipLimit && (
                  <p className="kb-wip-warning" role="status">
                    {column.cards.length > column.wipLimit
                      ? 'Limite de trabalho excedido'
                      : 'Limite de trabalho atingido'}
                  </p>
                )}
                {column.cards.filter(matchesFilters).map((card) => (
                  <div
                    key={card.id}
                    className="kb-drop-target"
                    data-position={
                      dropTarget?.cardId === card.id && dropTarget?.columnId === column.id
                        ? dropTarget.side
                        : undefined
                    }
                  >
                    <KanbanCard
                      key={card.id}
                      card={card}
                      column={column}
                      columns={board.colunas}
                      member={members.find((member) => member.id === card.responsavelId)}
                      busy={busy}
                      moving={pendingOperation === `card.move:${card.id}`}
                      draggable={canEdit && !busy && !filtered}
                      readOnly={!canEdit}
                      onDropTarget={(cardId, side) =>
                        setDropTarget({ columnId: column.id, cardId, side })
                      }
                      onDragStop={() => setDropTarget(null)}
                      onOpen={() => openCard(card)}
                      onMove={(columnId, position) => move(card, columnId, position)}
                    />
                  </div>
                ))}
                {!column.cards.some(matchesFilters) && (
                  <p className="kb-hint">
                    {column.cards.length
                      ? 'Nenhum card corresponde aos filtros'
                      : 'Nenhum card nesta etapa'}
                  </p>
                )}
                <button
                  className="kb-add"
                  disabled={busy || !canEdit}
                  onClick={() => setEditor({ kind: 'card', colunaId: column.id })}
                >
                  <Plus size={16} /> Adicionar card
                </button>
              </section>
            ))}
          </div>
          {!board.colunas.length && <p>Este quadro ainda não tem colunas.</p>}
        </>
      )}
      {editor?.kind === 'card' && (
        <CardEditor
          key={`${editor.id || 'new'}-${editor.updatedAt || editor.colunaId}`}
          card={editor}
          authApi={authApi}
          readOnly={!canEdit}
          archiving={pendingOperation === 'card.archive'}
          onArchive={() =>
            run(async () => {
              await authApi.patch(`/kanban/cards/${editor.id}/arquivar`, {
                expectedUpdatedAt: editor.updatedAt,
              });
              setEditor(null);
              await reload();
            }, 'card.archive')
          }
          latestCard={board?.colunas
            .flatMap((column) => column.cards)
            .find((card) => card.id === editor.id)}
          columnName={board?.colunas.find((column) => column.id === editor.colunaId)?.nome}
          members={members}
          comments={comments}
          commentsLoading={commentsLoading}
          commentsError={commentsError}
          commentSubmitting={pendingOperation === 'comment.create'}
          saving={pendingOperation === 'card.save'}
          reloading={pendingOperation === 'card.reload'}
          busy={busy}
          error={error}
          user={user}
          onSave={saveCard}
          onClose={() => setEditor(null)}
          onReload={() =>
            run(async () => {
              const [card] = await Promise.all([
                authApi.get(`/kanban/cards/${editor.id}`),
                reload(),
              ]);
              setEditor({ kind: 'card', ...card });
            }, 'card.reload')
          }
          onDelete={() =>
            requestDeletion({
              kind: 'card',
              id: editor.id,
              path: `/kanban/cards/${editor.id}`,
              name: editor.titulo,
            })
          }
          onComment={(conteudo, mencionados) =>
            run(async () => {
              const created = await authApi.post(`/kanban/cards/${editor.id}/comments`, {
                conteudo,
                mencionados,
              });
              setComments((current) =>
                current.some((comment) => comment.id === created.id)
                  ? current
                  : [...current, created],
              );
              // O comentário já existe; uma falha na consulta não deve sugerir reenviar.
              await loadComments(editor.id).catch((error) => setCommentsError(error.message));
            }, 'comment.create')
          }
          onDeleteComment={(id) =>
            requestDeletion({
              kind: 'comment',
              id,
              path: `/kanban/comments/${id}`,
              name: 'comentário',
            })
          }
        />
      )}
      {deleting && (
        <ConfirmationDialog
          title={
            deleting.kind === 'column'
              ? 'Excluir coluna?'
              : deleting.kind === 'comment'
                ? 'Excluir comentário?'
                : 'Excluir card?'
          }
          description={
            deleting.kind === 'card'
              ? `O card “${deleting.name}” e seus comentários serão excluídos. Esta ação não pode ser desfeita.`
              : deleting.kind === 'column'
                ? `A coluna “${deleting.name}” será excluída. Ela precisa estar vazia para continuar.`
                : 'O comentário será excluído permanentemente. Esta ação não pode ser desfeita.'
          }
          confirmLabel={
            deleting.kind === 'column'
              ? 'Excluir coluna'
              : deleting.kind === 'comment'
                ? 'Excluir comentário'
                : 'Excluir card'
          }
          busy={busy}
          error={error}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
      {editor?.kind === 'column' && (
        <EditorDialog busy={busy} onClose={() => setEditor(null)}>
          <header>
            <h2 id="kb-editor-title">{editor.id ? 'Editar coluna' : 'Criar coluna'}</h2>
            <button aria-label="Fechar" disabled={busy} onClick={() => setEditor(null)}>
              <X size={18} />
            </button>
          </header>
          <form onSubmit={saveColumn}>
            <label>
              Nome
              <input
                autoFocus
                name="nome"
                required
                maxLength={200}
                defaultValue={editor.nome || ''}
              />
            </label>
            <label>
              Limite de cards em andamento (opcional)
              <input
                type="number"
                name="wipLimit"
                min="1"
                max="10000"
                defaultValue={editor.wipLimit ?? ''}
                placeholder="Sem limite"
              />
            </label>
            <p className="kb-hint">
              Exibe um aviso ao atingir o limite, sem bloquear movimentações.
            </p>
            <Button
              variant="outline"
              type="submit"
              disabled={busy}
              loading={pendingOperation === 'column.save'}
              loadingText="Salvando coluna…"
            >
              Salvar coluna
            </Button>
          </form>
          {error && (
            <p role="alert" className="kb-error">
              {error}
            </p>
          )}
        </EditorDialog>
      )}
    </>
  );
}
