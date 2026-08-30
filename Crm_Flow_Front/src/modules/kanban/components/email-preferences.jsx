/**
 * @file Renderiza email preferences, na área de Kanban, expondo os estados e eventos
 * necessários à interface.
 */
import { useEffect, useState } from 'react';
import { Mail, RefreshCw, Save, X } from 'lucide-react';

import { LoadingState } from '@/components/loading-state';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

import { EditorDialog } from './editor-dialog';

export function EmailPreferences({ authApi, onClose }) {
  const [loaded, setLoaded] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;

    authApi
      .get('/kanban/email-preferences')
      .then((data) => {
        if (active) {
          setEnabled(data.enabled);
          setLoaded(true);
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
  }, [authApi, revision]);

  async function handleSave() {
    setSaving(true);
    setError('');

    try {
      await authApi.put('/kanban/email-preferences', { enabled });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <EditorDialog
      busy={saving}
      onClose={onClose}
      titleId="kb-email-title"
      className="kb-card-editor max-w-lg"
    >
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground"
            aria-hidden="true"
          >
            <Mail className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <h2
              id="kb-email-title"
              className="text-base font-semibold tracking-tight text-foreground"
            >
              Notificações por e-mail
            </h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Escolha se deseja receber avisos automáticos do Kanban no seu e-mail.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fechar"
          disabled={saving}
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="py-6">
            <LoadingState label="Carregando preferência…" />
          </div>
        ) : (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/80 bg-muted/25 p-4 transition-colors hover:border-border-strong">
            <Checkbox
              checked={enabled}
              disabled={saving || !loaded}
              onCheckedChange={(checkedValue) => setEnabled(checkedValue)}
              className="mt-0.5"
            />
            <div className="min-w-0 space-y-1">
              <span className="block text-sm font-medium text-foreground">
                Receber e-mails do Kanban
              </span>
              <span className="block text-xs leading-relaxed text-muted-foreground">
                Inclui novas atribuições, menções, atualizações dos cards que você segue e um
                lembrete no dia do prazo. Não enviamos avisos das suas próprias atribuições.
              </span>
            </div>
          </label>
        )}

        {error && (
          <div className="space-y-2.5">
            <Alert variant="destructive" role="alert">
              {error}
            </Alert>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                setRevision((v) => v + 1);
              }}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Tentar novamente
            </Button>
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-card px-6 py-3.5">
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={loading || !loaded}
          loading={saving}
          loadingText="Salvando…"
          onClick={handleSave}
        >
          <Save className="size-3.5" aria-hidden="true" />
          Salvar preferência
        </Button>
      </footer>
    </EditorDialog>
  );
}
