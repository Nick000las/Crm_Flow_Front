/**
 * @file Gerencia criação e edição de quadros nativos e a seleção de participantes com acesso
 * automático do autor.
 */
import './kanban.css';

import { useEffect, useState } from 'react';
import { ArrowUpRight, KanbanSquare, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { EmptyState } from '@/components/empty-state';
import { AsyncContent, CardGridSkeleton } from '@/components/loading-skeletons';
import { ModalPresence } from '@/components/motion/modal-presence';
import { PageHeader } from '@/components/page-header';
import { StatusToast } from '@/components/status-toast';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

import { BoardSettingsForm } from '../components/board-settings-form';
import { useKanbanEvents } from '../hooks/use-kanban-events';
import { quadrosNativos } from '../lib/board-modo';
import { getBoardTypeLabel } from '../lib/board-types';

export default function BoardsManagementPage() {
  const { authApi, user } = useAuth();
  const canManage = ['DONO', 'MASTER'].includes(user?.role);
  const [boards, setBoards] = useState([]);
  const [members, setMembers] = useState([]);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState('');
  const [membersRevision, setMembersRevision] = useState(0);
  const [completedRefresh, setCompletedRefresh] = useState(-1);
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    let active = true;

    authApi
      .get('/kanban/boards')
      .then((rows) => {
        if (active) {
          setBoards(quadrosNativos(rows));
          setError('');
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setCompletedRefresh(refresh);
        }
      });

    return () => {
      active = false;
    };
  }, [authApi, canManage, refresh]);

  useEffect(() => {
    if (!canManage) {
      return;
    }

    let active = true;

    authApi
      .get('/kanban/membros')
      .then((users) => {
        if (active) {
          setMembers(users);
          setMembersError('');
        }
      })
      .catch((requestError) => {
        if (active) {
          setMembersError(requestError.message);
        }
      })
      .finally(() => {
        if (active) {
          setMembersLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authApi, canManage, membersRevision]);

  const refreshing = !loading && completedRefresh !== refresh;

  useKanbanEvents((event) => {
    if (event.type.startsWith('board.') || event.type === 'connection.restored') {
      setRefresh((value) => value + 1);
    }

    if (event.type === 'board.delete' && event.boardId === deleting?.id) {
      setDeleting(null);
    }

    if (event.type === 'board.delete' && event.boardId === editing?.id) {
      setEditing(null);
      setNotice('Este quadro foi excluído por outra pessoa.');
    }
  });

  function openNewBoard() {
    setFormError('');
    setEditing({ participantes: [] });
  }

  async function edit(board) {
    setPendingAction(`edit:${board.id}`);
    setBusy(true);
    setError('');
    setFormError('');

    try {
      const participantes = await authApi.get(`/kanban/boards/${board.id}/membros`);

      setEditing({ ...board, participantes });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  async function save(payload) {
    setPendingAction('save');
    setBusy(true);
    setFormError('');

    try {
      if (editing.id) {
        await authApi.patch(`/kanban/boards/${editing.id}`, payload);
      } else {
        await authApi.post('/kanban/boards', payload);
      }
    } catch (requestError) {
      setFormError(requestError.message);
      setBusy(false);
      setPendingAction(null);

      return;
    }

    setEditing(null);
    setNotice('Quadro e equipe salvos.');
    setRefresh((value) => value + 1);
    setBusy(false);
    setPendingAction(null);
  }

  async function remove(board) {
    setPendingAction('delete');
    setBusy(true);
    setError('');

    try {
      await authApi.delete(`/kanban/boards/${board.id}`);
      setBoards((current) => current.filter((item) => item.id !== board.id));
      setNotice('Quadro excluído.');
      setDeleting(null);
    } catch (requestError) {
      setError(requestError.message);

      return false;
    } finally {
      setBusy(false);
      setPendingAction(null);
    }
  }

  if (!canManage) {
    return <Navigate to="/kanban" replace />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Kanban"
        title="Gerenciar quadros"
        description="Configure os quadros e escolha a equipe com acesso a cada um."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy || loading}
              loading={refreshing}
              loadingText="Atualizando…"
              onClick={() => {
                setError('');
                setRefresh((value) => value + 1);
              }}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Atualizar
            </Button>
            <Button
              type="button"
              data-tour="kanban-manage-new"
              disabled={busy || loading}
              onClick={openNewBoard}
            >
              <Plus className="size-4" aria-hidden="true" />
              Novo quadro
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive" role="alert">
          {error}
        </Alert>
      )}

      <StatusToast message={notice} onDismiss={() => setNotice('')} />

      <AsyncContent
        loading={loading}
        skeleton={
          <CardGridSkeleton cards={3} columnsClass="grid-cols-1" label="Carregando quadros…" />
        }
      >
        {boards.length === 0 && !error ? (
          <EmptyState
            icon={KanbanSquare}
            title="Nenhum quadro criado"
            description="Crie um quadro e selecione as pessoas que vão participar."
            action={
              <Button type="button" onClick={openNewBoard}>
                <Plus className="size-4" aria-hidden="true" />
                Novo quadro
              </Button>
            }
          />
        ) : (
          <div data-tour="kanban-manage-list" className="grid gap-3">
            {boards.map((board) => (
              <Card
                as="article"
                layout="plain"
                key={board.id}
                className="group flex flex-col gap-4 p-4 transition-colors hover:border-border-strong sm:flex-row sm:items-center sm:justify-between sm:p-5"
              >
                <div className="flex min-w-0 items-start gap-3.5">
                  <span
                    className="grid size-10 shrink-0 place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:bg-primary/10 group-hover:text-primary"
                    aria-hidden="true"
                  >
                    <KanbanSquare className="size-5" strokeWidth={1.6} />
                  </span>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate text-base font-semibold tracking-tight text-foreground">
                        {board.nome}
                      </h2>
                      <Badge variant="secondary" className="font-normal">
                        {getBoardTypeLabel(board.boardType)}
                      </Badge>
                    </div>

                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                      <Users className="size-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {board.totalParticipantes}{' '}
                        {board.totalParticipantes === 1 ? 'participante' : 'participantes'}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3 sm:shrink-0 sm:border-t-0 sm:pt-0">
                  <Button
                    size="sm"
                    variant="outline"
                    nativeButton={false}
                    render={<Link to={`/kanban?quadro=${board.id}`} />}
                  >
                    Abrir quadro
                    <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    loading={pendingAction === `edit:${board.id}`}
                    loadingText="Carregando…"
                    onClick={() => edit(board)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Editar equipe
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    disabled={busy}
                    onClick={() => {
                      setError('');
                      setDeleting(board);
                    }}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Excluir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </AsyncContent>

      <ModalPresence>
        {deleting && (
          <ConfirmationDialog
            title="Excluir quadro?"
            description={`O quadro “${deleting.nome}”, seus cards e comentários serão excluídos. Esta ação não pode ser desfeita.`}
            confirmLabel="Excluir quadro"
            busy={busy}
            error={error}
            onConfirm={() => remove(deleting)}
            onClose={() => setDeleting(null)}
          />
        )}
      </ModalPresence>

      <ModalPresence>
        {editing && (
          <BoardSettingsForm
            board={editing}
            currentUser={user}
            members={members}
            busy={busy}
            saving={pendingAction === 'save'}
            membersLoading={membersLoading}
            membersError={membersError}
            onRetryMembers={() => {
              setMembersLoading(true);
              setMembersError('');
              setMembersRevision((value) => value + 1);
            }}
            error={formError}
            onSave={save}
            onClose={() => setEditing(null)}
          />
        )}
      </ModalPresence>
    </div>
  );
}
