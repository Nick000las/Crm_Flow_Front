/**
 * @file Compartilha estado e efeitos de use available boards, na área de Kanban, entre
 * consumidores da interface.
 */
import { useEffect, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';

import { quadrosDaGaleria } from '../lib/board-modo';
import { useKanbanEvents } from './use-kanban-events';

export function useAvailableBoards() {
  const { authApi } = useAuth();
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const [completedRevision, setCompletedRevision] = useState(-1);

  useEffect(() => {
    let active = true;

    authApi
      .get('/kanban/boards')
      .then((rows) => {
        if (active) {
          setBoards(quadrosDaGaleria(rows));
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
          setCompletedRevision(revision);
        }
      });

    return () => {
      active = false;
    };
  }, [authApi, revision]);

  useKanbanEvents((event) => {
    if (
      event.type.startsWith('board.') ||
      ['access.revoked', 'connection.restored'].includes(event.type)
    ) {
      setRevision((value) => value + 1);
    }
  });

  function refresh() {
    setError('');
    setRevision((value) => value + 1);
  }

  return {
    boards,
    loading,
    refreshing: !loading && completedRevision !== revision,
    error,
    refresh,
  };
}
