import { useEffect, useState } from 'react';
import { EditorDialog } from './editor-dialog';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/loading-state';
export function BoardArchives({ boardId, authApi, canEdit, onClose, onRestored }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    authApi
      .get(`/kanban/boards/${boardId}/arquivados`)
      .then((data) => {
        if (active) {
          setRows(data);
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
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
  }, [boardId, authApi, revision]);
  async function restore(card) {
    setPending(card.id);
    setError('');
    try {
      await authApi.patch(`/kanban/cards/${card.id}/restaurar`, {
        expectedUpdatedAt: card.updatedAt,
      });
      setRows((current) => current.filter((row) => row.id !== card.id));
      await onRestored();
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  }
  return (
    <EditorDialog busy={Boolean(pending)} onClose={onClose} titleId="kb-archives-title">
      <header>
        <h2 id="kb-archives-title">Cards arquivados</h2>
        <Button variant="ghost" disabled={Boolean(pending)} onClick={onClose}>
          Fechar
        </Button>
      </header>
      <p className="kb-hint">
        Cards arquivados preservam conteúdo e comentários. Restaurar devolve o card ao final da
        etapa original.
      </p>
      {loading && <LoadingState label="Carregando arquivo…" />}
      {error && (
        <p className="kb-error" role="alert">
          {error}
        </p>
      )}
      <Button
        variant="outline"
        disabled={Boolean(pending)}
        loading={loading}
        onClick={() => {
          setLoading(true);
          setRevision((v) => v + 1);
        }}
      >
        Atualizar arquivo
      </Button>
      {!loading && !error && !rows.length && <p>Nenhum card arquivado.</p>}
      <ul className="kb-archive-list">
        {rows.map((card) => (
          <li key={card.id}>
            <span>{card.titulo}</span>
            {canEdit && (
              <Button
                variant="outline"
                disabled={Boolean(pending)}
                loading={pending === card.id}
                loadingText="Restaurando…"
                onClick={() => restore(card)}
              >
                Restaurar
              </Button>
            )}
          </li>
        ))}
      </ul>
    </EditorDialog>
  );
}
