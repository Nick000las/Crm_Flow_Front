/**
 * @file Coordena a interação com um quadro nativo: consultas, editor, filtros, movimentação e
 * ações em lote.
 */
import './kanban.css';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Columns3,
  Eye,
  FileText,
  Mail,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { BoardSkeleton } from '@/components/loading-skeletons';
import { ModalPresence } from '@/components/motion/modal-presence';
import { StatusToast } from '@/components/status-toast';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';

import { BoardArchives } from '../components/board-archives';
import { BoardFilters } from '../components/board-filters';
import { BoardReport } from '../components/board-report';
import { BulkCardActions } from '../components/bulk-card-actions';
import { CardEditor } from '../components/card-editor';
import { ColumnFlowFields } from '../components/column-flow-fields';
import { EditorDialog } from '../components/editor-dialog';
import { EmailPreferences } from '../components/email-preferences';
import { KanbanCard } from '../components/kanban-card';
import { useKanbanEvents } from '../hooks/use-kanban-events';
import { getBoardTypeLabel } from '../lib/board-types';
import { getCardDetails, getDueState } from '../lib/card-details';
import { columnRulesFromForm } from '../lib/flow';
import { podeVincular, TIPO_PESSOA } from '../lib/vinculo';

export default function KanbanPage({ boardId }) {
  const { authApi, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [reportOpen, setReportOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selection, setSelection] = useState(new Set());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);

    return () => clearInterval(timer);
  }, []);

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
        closeCard();
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

      const archivedInBatch =
        event.type === 'card.batch' &&
        event.batchAction === 'arquivar' &&
        event.cardIds?.includes(editor?.id);

      if (
        (['card.delete', 'card.archive'].includes(event.type) && event.cardId === editor?.id) ||
        archivedInBatch
      ) {
        closeCard();
        setDeleting(null);
        commentsVersion.current++;

        if (event.actorId !== user?.id) {
          setNotice(
            event.type === 'card.archive' || archivedInBatch
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

  /**
   * Vincular muda o `updatedAt` do card: o editor recebe o novo, senão o
   * salvar daria conflito, mas não remonta, para o rascunho ficar. O DELETE
   * não devolve o card, então a versão vem sempre do GET.
   */
  async function changeLink(entidadeId) {
    const path = `/kanban/cards/${editor.id}/vinculo`;

    await run(async () => {
      if (entidadeId) {
        await authApi.put(path, { entidadeTipo: TIPO_PESSOA, entidadeId });
      } else {
        await authApi.delete(path);
      }

      const { updatedAt, vinculo } = await authApi.get(`/kanban/cards/${editor.id}`);

      setEditor((current) => current && { ...current, updatedAt, vinculo });
      await reload();
    }, 'card.link');
  }

  async function openCard(card, tab = 'details') {
    setEditor({ kind: 'card', ...card, initialTab: tab });

    setSearchParams(
      (current) => {
        current.set('card', card.id);

        return current;
      },
      { replace: true },
    );

    setComments([]);
    setError('');
    await loadComments(card.id).catch(() => {});
  }

  const linkedCardId = searchParams.get('card');

  useEffect(() => {
    if (!linkedCardId || editor) {
      return;
    }

    let active = true;

    authApi
      .get(`/kanban/cards/${encodeURIComponent(linkedCardId)}`)
      .then((linked) => {
        if (!active) {
          return;
        }

        if (linked.boardId !== boardId || linked.archivedAt) {
          throw new Error('Card indisponível neste quadro.');
        }

        setEditor({ kind: 'card', ...linked });
        loadComments(linked.id).catch(() => {});
      })
      .catch((error) => {
        if (active) {
          setError(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [linkedCardId, editor, authApi, boardId, loadComments]);

  function closeCard() {
    setEditor(null);

    setSearchParams(
      (current) => {
        current.delete('card');

        return current;
      },
      { replace: true },
    );
  }

  async function duplicateCard(modelo) {
    return run(async () => {
      const copy = await authApi.post(`/kanban/cards/${editor.id}/duplicar`, { modelo });

      await reload();

      if (modelo) {
        setNotice('Modelo salvo. Use a opção Modelos do quadro.');
      } else {
        await openCard(copy);
      }
    }, 'card.duplicate');
  }

  async function quickUpdate(card, patch) {
    return run(async () => {
      await authApi.patch(`/kanban/cards/${card.id}`, {
        ...patch,
        expectedUpdatedAt: card.updatedAt,
      });

      await reload();
    }, 'card.quick-update');
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
      regrasFluxo: columnRulesFromForm(form),
    };

    if (
      !data.nome?.trim() ||
      (data.wipLimit !== null &&
        (!Number.isInteger(data.wipLimit) || data.wipLimit < 1 || data.wipLimit > 10000)) ||
      (data.regrasFluxo.diasSemMovimento !== null &&
        (!Number.isInteger(data.regrasFluxo.diasSemMovimento) ||
          data.regrasFluxo.diasSemMovimento < 1 ||
          data.regrasFluxo.diasSemMovimento > 365)) ||
      (data.regrasFluxo.automacao.prazoDias !== null &&
        (!Number.isInteger(data.regrasFluxo.automacao.prazoDias) ||
          data.regrasFluxo.automacao.prazoDias < 0 ||
          data.regrasFluxo.automacao.prazoDias > 365))
    ) {
      setError('Informe um nome e limites válidos para a coluna.');

      return;
    }

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
      closeCard();
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
          closeCard();
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
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            nativeButton={false}
            render={<Link to="/kanban" />}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Voltar aos quadros
          </Button>
          {board?.boardType && (
            <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {getBoardTypeLabel(board.boardType)}
            </span>
          )}
          {board && !canEdit && (
            <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              <Eye className="h-3 w-3" aria-hidden="true" />
              Somente leitura
            </span>
          )}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
              {board?.nome ?? 'Quadro Kanban'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Acompanhe as etapas e organize o trabalho da equipe.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {board && canEdit && (board.modelos ?? []).length > 0 && (
              <div className="relative">
                <FileText
                  className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <NativeSelect
                  size="sm"
                  aria-label="Criar card a partir de modelo"
                  value=""
                  disabled={busy}
                  onChange={(event) => {
                    const model = board.modelos.find((item) => item.id === event.target.value);

                    if (model) {
                      setEditor({
                        kind: 'card',
                        titulo: model.titulo,
                        responsavelId: model.responsavelId,
                        colunaId: model.colunaId,
                        dadosExtras: { ...model.dadosExtras, modelo: false, seguidores: [] },
                      });
                    }
                  }}
                  className="pl-8 pr-8 text-xs font-medium hover:bg-accent"
                >
                  <option value="">Usar modelo…</option>
                  {board.modelos.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.titulo}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={busy || loading}
              loading={boardRequests > 0 || pendingOperation === 'board.refresh'}
              loadingText="Atualizando…"
              onClick={() => run(reload)}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Atualizar
            </Button>
            {board && (
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => setArchiveOpen(true)}
              >
                <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                Arquivados
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEmailOpen(true)}>
              <Mail className="h-3.5 w-3.5" aria-hidden="true" />
              E-mails
            </Button>
            {board && (
              <Button variant="outline" size="sm" onClick={() => setReportOpen(true)}>
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                Relatório
              </Button>
            )}
            {board && canManage && (
              <Button size="sm" disabled={busy} onClick={() => setEditor({ kind: 'column' })}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova coluna
              </Button>
            )}
          </div>
        </div>
      </header>
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
      <ModalPresence>
        {reportOpen && board && (
          <BoardReport board={board} authApi={authApi} onClose={() => setReportOpen(false)} />
        )}
      </ModalPresence>
      <ModalPresence>
        {archiveOpen && (
          <BoardArchives
            boardId={boardId}
            authApi={authApi}
            canEdit={canEdit}
            onClose={() => setArchiveOpen(false)}
            onRestored={reload}
          />
        )}
      </ModalPresence>
      <ModalPresence>
        {emailOpen && <EmailPreferences authApi={authApi} onClose={() => setEmailOpen(false)} />}
      </ModalPresence>
      {error && (
        <Alert variant="destructive" role="alert">
          {error}
        </Alert>
      )}
      <StatusToast message={notice} onDismiss={() => setNotice('')} />
      {loading ? (
        <BoardSkeleton label="Carregando quadro…" />
      ) : !board ? (
        <div className="kb-empty">
          <h2>Quadro indisponível</h2>
          <p>Volte à lista de quadros ou tente atualizar esta página.</p>
        </div>
      ) : (
        <>
          {board && canEdit && (
            <BulkCardActions
              enabled={selectionMode}
              onToggle={() => {
                setSelectionMode((value) => !value);
                setSelection(new Set());
              }}
              selected={board.colunas
                .flatMap((column) => column.cards)
                .filter((card) => selection.has(card.id))}
              onSelectVisible={() =>
                setSelection(
                  new Set(
                    board.colunas
                      .flatMap((column) => column.cards)
                      .filter(matchesFilters)
                      .slice(0, 100)
                      .map((card) => card.id),
                  ),
                )
              }
              columns={board.colunas}
              members={members}
              busy={busy}
              onApply={(payload) =>
                run(async () => {
                  const cards = board.colunas
                    .flatMap((column) => column.cards)
                    .filter((card) => selection.has(card.id));

                  await authApi.post(`/kanban/boards/${boardId}/cards/lote`, {
                    ...payload,
                    cards: cards.map((card) => ({
                      id: card.id,
                      expectedUpdatedAt: card.updatedAt,
                    })),
                  });

                  setSelection(new Set());
                  setNotice(`${cards.length} cards atualizados.`);
                  await reload({ clearError: false });
                }, 'card.batch')
              }
            />
          )}
          <div className="kb-board" data-drag-boundary>
            {board.colunas.map((column, index) => {
              const visibleCards = column.cards.filter(matchesFilters);
              const wipExceeded = Boolean(column.wipLimit && column.cards.length > column.wipLimit);

              return (
                <section
                  key={column.id}
                  className="kb-column"
                  aria-busy={pendingOperation === `column.move:${column.id}`}
                  aria-label={column.nome}
                  data-wip-exceeded={wipExceeded ? true : undefined}
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
                  <header className="mb-3 flex items-center justify-between gap-2">
                    <h2 className="flex min-w-0 items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
                      <span className="truncate">{column.nome}</span>
                      <span
                        className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums ${
                          wipExceeded
                            ? 'bg-destructive/15 text-destructive'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {column.cards.length}
                        {column.wipLimit ? `/${column.wipLimit}` : ''}
                      </span>
                      {pendingOperation === `column.move:${column.id}` && (
                        <Spinner className="ml-1 inline-block shrink-0" />
                      )}
                    </h2>
                    {canManage && (
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Mover coluna para esquerda"
                          disabled={busy || index === 0}
                          onClick={() => reorderColumn(index, -1)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label="Mover coluna para direita"
                          disabled={busy || index === board.colunas.length - 1}
                          onClick={() => reorderColumn(index, 1)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Editar ${column.nome}`}
                          disabled={busy}
                          onClick={() => setEditor({ kind: 'column', ...column })}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
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
                          className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </header>

                  {column.wipLimit && column.cards.length >= column.wipLimit && (
                    <p className="kb-wip-warning" role="status">
                      {wipExceeded ? 'Limite de trabalho excedido' : 'Limite de trabalho atingido'}
                    </p>
                  )}

                  <div className="flex flex-1 flex-col gap-2.5 pb-3">
                    {visibleCards.map((card) => (
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
                          now={now}
                          selectionControl={
                            selectionMode && canEdit ? (
                              <label className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                                <Checkbox
                                  aria-label={`Selecionar ${card.titulo}`}
                                  checked={selection.has(card.id)}
                                  disabled={
                                    busy || (!selection.has(card.id) && selection.size >= 100)
                                  }
                                  onCheckedChange={(checked) =>
                                    setSelection((current) => {
                                      const next = new Set(current);

                                      if (checked) {
                                        next.add(card.id);
                                      } else {
                                        next.delete(card.id);
                                      }

                                      return next;
                                    })
                                  }
                                />
                                Selecionar card
                              </label>
                            ) : null
                          }
                          column={column}
                          columns={board.colunas}
                          member={members.find((member) => member.id === card.responsavelId)}
                          busy={busy}
                          moving={pendingOperation === `card.move:${card.id}`}
                          draggable={canEdit && !busy && !filtered && !selectionMode}
                          readOnly={!canEdit}
                          onDropTarget={(cardId, side) =>
                            setDropTarget({ columnId: column.id, cardId, side })
                          }
                          onDragStop={() => setDropTarget(null)}
                          onOpen={(tab) =>
                            openCard(card, typeof tab === 'string' ? tab : 'details')
                          }
                          members={members}
                          onQuickUpdate={(patch) => quickUpdate(card, patch)}
                          onMove={(columnId, position) => move(card, columnId, position)}
                        />
                      </div>
                    ))}
                    {visibleCards.length === 0 && (
                      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/70 bg-background/30 px-3 py-8 text-center text-xs text-muted-foreground">
                        {column.cards.length
                          ? 'Nenhum card corresponde aos filtros'
                          : 'Nenhum card nesta etapa'}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={busy || !canEdit}
                    onClick={() => setEditor({ kind: 'card', colunaId: column.id })}
                    className="mt-auto w-full justify-center border-dashed border-border/90 bg-card/60 text-muted-foreground hover:border-border-strong hover:bg-accent hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Adicionar card
                  </Button>
                </section>
              );
            })}
          </div>
          {!board.colunas.length && (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Este quadro ainda não tem colunas.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Crie uma nova coluna acima para começar a organizar seus cards.
              </p>
            </div>
          )}
        </>
      )}
      <ModalPresence>
        {editor?.kind === 'card' && (
          <CardEditor
            canLink={podeVincular(user, canEdit)}
            onChangeLink={changeLink}
            key={`${editor.id || 'new'}-${editor.editorRevision ?? editor.colunaId}`}
            card={editor}
            initialTab={editor.initialTab}
            columns={board?.colunas ?? []}
            cards={board?.colunas.flatMap((column) => column.cards) ?? []}
            onDuplicate={duplicateCard}
            onFollow={(seguindo) =>
              run(async () => {
                const updated = await authApi.put(`/kanban/cards/${editor.id}/seguir`, {
                  seguindo,
                });

                setEditor({ kind: 'card', ...updated });
                await reload();
              }, 'card.follow')
            }
            onCopyLink={() =>
              run(async () => {
                const url = new URL(window.location.href);

                url.searchParams.set('card', editor.id);
                await navigator.clipboard.writeText(url.href);
                setNotice('Link do card copiado.');
              })
            }
            onEditComment={(id, conteudo) =>
              run(async () => {
                await authApi.patch(`/kanban/comments/${id}`, { conteudo });
                await loadComments(editor.id);
              }, 'comment.update')
            }
            authApi={authApi}
            readOnly={!canEdit}
            archiving={pendingOperation === 'card.archive'}
            onArchive={() =>
              run(async () => {
                await authApi.patch(`/kanban/cards/${editor.id}/arquivar`, {
                  expectedUpdatedAt: editor.updatedAt,
                });

                closeCard();
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
            onClose={closeCard}
            onReload={() =>
              run(async () => {
                const [card] = await Promise.all([
                  authApi.get(`/kanban/cards/${editor.id}`),
                  reload(),
                ]);

                setEditor({ kind: 'card', ...card, editorRevision: card.updatedAt });
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
      </ModalPresence>
      <ModalPresence>
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
      </ModalPresence>
      <ModalPresence>
        {editor?.kind === 'column' && (
          <EditorDialog
            busy={busy}
            onClose={() => setEditor(null)}
            className="kb-card-editor kb-card-editor--new"
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
              <div className="flex min-w-0 items-start gap-3">
                <span
                  className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground"
                  aria-hidden="true"
                >
                  <Columns3 className="size-4" />
                </span>
                <div className="min-w-0 space-y-1">
                  <h2
                    id="kb-editor-title"
                    className="text-base font-semibold tracking-tight text-foreground"
                  >
                    {editor.id ? 'Editar coluna' : 'Criar coluna'}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Defina o nome, limite de trabalho e regras de entrada desta etapa.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Fechar"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                <X className="size-4" />
              </Button>
            </header>

            <Form className="flex min-h-0 flex-1 flex-col" noValidate onSubmit={saveColumn}>
              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_1fr]">
                    <div className="space-y-1.5">
                      <label
                        htmlFor="kb-column-name"
                        className="block text-xs font-medium text-muted-foreground"
                      >
                        Nome <span className="text-destructive">*</span>
                      </label>
                      <Input
                        id="kb-column-name"
                        autoFocus
                        name="nome"
                        required
                        maxLength={200}
                        placeholder="Ex.: Em andamento"
                        defaultValue={editor.nome || ''}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor="kb-column-wip"
                        className="block text-xs font-medium text-muted-foreground"
                      >
                        Limite de cards (opcional)
                      </label>
                      <Input
                        id="kb-column-wip"
                        type="number"
                        name="wipLimit"
                        min="1"
                        max="10000"
                        defaultValue={editor.wipLimit ?? ''}
                        placeholder="Sem limite"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Exibe um aviso ao ultrapassar o limite, sem bloquear movimentações.
                  </p>
                </div>

                <ColumnFlowFields rules={editor.regrasFluxo} members={members} />

                {error && (
                  <Alert variant="destructive" role="alert">
                    {error}
                  </Alert>
                )}
              </div>

              <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card px-6 py-3.5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditor(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={busy}
                  loading={pendingOperation === 'column.save'}
                  loadingText="Salvando coluna…"
                >
                  Salvar coluna
                </Button>
              </footer>
            </Form>
          </EditorDialog>
        )}
      </ModalPresence>
    </div>
  );
}
