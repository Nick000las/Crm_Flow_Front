import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { PageHeader } from '@/components/page-header';
import { useKanbanEvents } from '../hooks/use-kanban-events';
import { BoardSettingsForm } from '../components/board-settings-form';
import { getBoardTypeLabel } from '../lib/board-types';
import './kanban.css';

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
          setBoards(rows);
          setError('');
        }
      })
      .catch((error) => {
        if (active) {
          setError(error.message);
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
      .catch((error) => {
        if (active) {
          setMembersError(error.message);
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

  async function edit(board) {
    setPendingAction(`edit:${board.id}`);
    setBusy(true);
    setError('');
    setFormError('');
    try {
      const participantes = await authApi.get(`/kanban/boards/${board.id}/membros`);
      setEditing({ ...board, participantes });
    } catch (error) {
      setError(error.message);
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
    } catch (error) {
      setFormError(error.message);
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
    } catch (error) {
      setError(error.message);
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
    <>
      <PageHeader
        title="Gerenciar quadros"
        description="Configure os quadros e escolha a equipe de cada um."
      />
      <div className="kb-toolbar">
        <button
          disabled={busy || loading}
          onClick={() => {
            setFormError('');
            setEditing({ participantes: members.filter((member) => member.id === user?.id) });
          }}
        >
          <Plus size={16} /> Novo quadro
        </button>
        <Button
          variant="outline"
          disabled={busy || loading}
          loading={refreshing}
          loadingText="Atualizando…"
          onClick={() => {
            setError('');
            setRefresh((value) => value + 1);
          }}
        >
          Atualizar
        </Button>
      </div>
      {error && (
        <p role="alert" className="kb-error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      {loading ? (
        <LoadingState label="Carregando quadros…" />
      ) : boards.length === 0 && !error ? (
        <div className="kb-empty">
          <h2>Nenhum quadro criado</h2>
          <p>Crie um quadro e selecione as pessoas que vão participar.</p>
        </div>
      ) : (
        <div className="kb-management-list">
          {boards.map((board) => (
            <article key={board.id} className="kb-board-summary">
              <div>
                <h2>{board.nome}</h2>
                <p className="kb-hint">{getBoardTypeLabel(board.boardType)}</p>
                <p className="kb-participant-count">
                  <Users size={16} /> {board.totalParticipantes}{' '}
                  {board.totalParticipantes === 1 ? 'participante' : 'participantes'}
                </p>
              </div>
              <div className="kb-actions">
                <Link to={`/kanban?quadro=${board.id}`}>Abrir quadro</Link>
                <Button
                  variant="outline"
                  disabled={busy}
                  loading={pendingAction === `edit:${board.id}`}
                  loadingText="Carregando equipe…"
                  onClick={() => edit(board)}
                >
                  <Pencil size={16} /> Editar quadro e equipe
                </Button>
                <button
                  className="kb-button-danger"
                  disabled={busy}
                  onClick={() => {
                    setError('');
                    setDeleting(board);
                  }}
                >
                  <Trash2 size={16} /> Excluir quadro
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
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
      {editing && (
        <BoardSettingsForm
          board={editing}
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
    </>
  );
}
