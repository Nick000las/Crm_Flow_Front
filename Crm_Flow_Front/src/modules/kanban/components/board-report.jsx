import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/loading-state';
import { EditorDialog } from './editor-dialog';

export function BoardReport({ board, authApi, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    authApi
      .get(`/kanban/boards/${board.id}/relatorio`)
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
      });
    return () => {
      active = false;
    };
  }, [authApi, board.id, retry]);
  return (
    <EditorDialog onClose={onClose}>
      <header>
        <h2 id="kb-editor-title">Tempo por etapa</h2>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </header>
      <p className="my-3 text-sm text-muted-foreground">
        Média de permanência por passagem, calculada desde o início do histórico. A etapa atual
        conta até agora.
      </p>
      {!rows && !error && <LoadingState label="Calculando relatório…" />}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <Button variant="outline" onClick={() => setRetry((value) => value + 1)}>
            Tentar novamente
          </Button>
        </div>
      )}
      {rows && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr>
              <th>Etapa</th>
              <th>Cards</th>
              <th>Média (horas)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="py-2">{row.nome}</td>
                <td>{row.cards}</td>
                <td>{Number(row.horas).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </EditorDialog>
  );
}
