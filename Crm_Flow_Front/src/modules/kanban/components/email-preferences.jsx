import { useEffect, useState } from 'react';
import { EditorDialog } from './editor-dialog';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/loading-state';
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
  return (
    <EditorDialog busy={saving} onClose={onClose} titleId="kb-email-title">
      <header>
        <h2 id="kb-email-title">Notificações por e-mail</h2>
        <Button variant="ghost" disabled={saving} onClick={onClose}>
          Fechar
        </Button>
      </header>
      <p className="kb-hint">
        Receba novas atribuições, menções em comentários e um lembrete no dia do prazo. Não enviamos
        avisos das suas próprias atribuições.
      </p>
      {loading ? (
        <LoadingState label="Carregando preferência…" />
      ) : (
        <label className="kb-toggle-email">
          <input
            type="checkbox"
            checked={enabled}
            disabled={saving || !loaded}
            onChange={(e) => setEnabled(e.target.checked)}
          />{' '}
          Receber e-mails do Kanban
        </label>
      )}
      {error && (
        <>
          <p role="alert" className="kb-error">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setLoading(true);
              setRevision((v) => v + 1);
            }}
          >
            Tentar novamente
          </Button>
        </>
      )}
      <Button
        variant="outline"
        disabled={loading || !loaded}
        loading={saving}
        loadingText="Salvando…"
        onClick={async () => {
          setSaving(true);
          try {
            await authApi.put('/kanban/email-preferences', { enabled });
            onClose();
          } catch (err) {
            setError(err.message);
          } finally {
            setSaving(false);
          }
        }}
      >
        Salvar preferência
      </Button>
    </EditorDialog>
  );
}
