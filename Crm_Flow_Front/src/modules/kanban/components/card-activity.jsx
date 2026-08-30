import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/loading-state';
import { History } from 'lucide-react';
const ACTIONS = {
  'card.create': 'criou o card',
  'card.complete': 'marcou a entrega como concluída',
  'card.update': 'alterou o card',
  'card.move': 'moveu o card',
  'card.archive': 'arquivou o card',
  'card.restore': 'restaurou o card',
  'comment.create': 'comentou no card',
  'card.delete': 'excluiu o card',
};
export function CardActivity({ cardId, authApi, revision }) {
  const [rows, setRows] = useState([]);
  const [completedRequest, setCompletedRequest] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const requestKey = `${cardId}:${revision}:${retry}`;
  const loading = completedRequest !== requestKey;
  useEffect(() => {
    let active = true;
    authApi
      .get(`/kanban/cards/${cardId}/activities`)
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
          setCompletedRequest(requestKey);
        }
      });
    return () => {
      active = false;
    };
  }, [cardId, authApi, revision, retry, requestKey]);
  return (
    <section className="kb-activity">
      <h3>
        <History size={17} aria-hidden="true" /> Histórico
      </h3>
      {loading && <LoadingState inline label="Carregando histórico…" />}
      {error && (
        <>
          <p className="kb-error" role="alert">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setRetry((v) => v + 1);
            }}
          >
            Tentar novamente
          </Button>
        </>
      )}
      {!loading && !error && !rows.length && (
        <p className="kb-hint">As próximas alterações serão registradas aqui.</p>
      )}
      <ol>
        {rows.map((row) => (
          <li key={row.id}>
            <p>
              <strong>{row.autor || 'Sistema'}</strong> {ACTIONS[row.action] || 'atualizou o card'}.
            </p>
            <time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString('pt-BR')}</time>
          </li>
        ))}
      </ol>
      {rows.length === 100 && <p className="kb-hint">Últimas 100 atividades.</p>}
    </section>
  );
}
