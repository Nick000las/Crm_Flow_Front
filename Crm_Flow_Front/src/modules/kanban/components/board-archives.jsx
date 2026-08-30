/**
 * @file Renderiza board archives, na área de Kanban, expondo os estados e eventos necessários à
 * interface.
 */
import { useEffect, useState } from 'react';
import { Archive, RefreshCw, RotateCcw, X } from 'lucide-react';

import { LoadingState } from '@/components/loading-state';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

import { EditorDialog } from './editor-dialog';

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
    <EditorDialog
      busy={Boolean(pending)}
      onClose={onClose}
      titleId="kb-archives-title"
      className="kb-card-editor max-w-xl"
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground"
            aria-hidden="true"
          >
            <Archive className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <h2
                id="kb-archives-title"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Cards arquivados
              </h2>
              {!loading && rows.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">
                  {rows.length}
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Conteúdo e comentários são preservados. Restaurar devolve o card ao final da etapa
              original.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fechar"
          disabled={Boolean(pending)}
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {error && (
          <Alert variant="destructive" role="alert" className="mb-4">
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="py-8">
            <LoadingState label="Carregando arquivo…" />
          </div>
        ) : !error && rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
            <span
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground"
              aria-hidden="true"
            >
              <Archive className="size-4" />
            </span>
            <p className="text-sm font-medium text-foreground">Nenhum card arquivado</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Quando você arquivar um card neste quadro, ele aparecerá aqui para consulta ou
              restauração.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {rows.map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:border-border-strong"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-muted-foreground/75">
                      #{card.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {card.titulo}
                    </span>
                  </div>
                  {card.updatedAt && (
                    <p className="text-xs text-muted-foreground">
                      Arquivado em {new Date(card.updatedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={Boolean(pending)}
                    loading={pending === card.id}
                    loadingText="Restaurando…"
                    onClick={() => restore(card)}
                    className="shrink-0"
                  >
                    <RotateCcw className="size-3.5" aria-hidden="true" />
                    Restaurar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface/80 px-6 py-3.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={Boolean(pending)}
          loading={loading}
          loadingText="Atualizando…"
          onClick={() => {
            setLoading(true);
            setRevision((v) => v + 1);
          }}
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Atualizar arquivo
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={Boolean(pending)}
          onClick={onClose}
        >
          Fechar
        </Button>
      </footer>
    </EditorDialog>
  );
}
