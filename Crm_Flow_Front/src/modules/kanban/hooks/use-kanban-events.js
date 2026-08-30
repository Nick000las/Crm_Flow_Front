import { useContext, useEffect, useRef } from 'react';
import { KanbanRealtimeContext } from '../lib/kanban-realtime-context';

const SUBSCRIBE_TIMEOUT_MS = 5000;

export function useKanbanConnection() {
  const context = useContext(KanbanRealtimeContext);
  if (!context) {
    throw new Error('O Kanban deve estar dentro do provedor de tempo real.');
  }
  return context;
}

/** Os callbacks recebem o estado mais recente sem reconectar a cada renderização. */
export function useKanbanEvents(onEvent, { boardId, cardId } = {}) {
  const { socket } = useKanbanConnection();
  const callback = useRef(onEvent);
  useEffect(() => {
    callback.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!socket) {
      return;
    }
    let active = true;
    const subscription = { boardId, ...(cardId && { cardId }) };
    const notify = (event) => {
      if (active) {
        callback.current(event);
      }
    };
    const changed = (event) => {
      if (boardId && event.boardId !== boardId) {
        return;
      }
      notify(event);
    };
    const revoked = (event) => {
      if (!boardId || event.boardId === boardId) {
        notify({ ...event, type: 'access.revoked' });
      }
    };
    const synchronize = () => {
      if (!active) {
        return;
      }
      if (!boardId) {
        notify({ type: 'connection.restored' });
        return;
      }
      socket.timeout(SUBSCRIBE_TIMEOUT_MS).emit('kanban:watch', subscription, (error, result) => {
        if (!active) {
          return;
        }
        if (!error && result?.ok) {
          notify({ type: 'connection.restored', boardId, cardId });
        } else if (['FORBIDDEN', 'RESOURCE_NOT_FOUND'].includes(result?.code)) {
          revoked({ boardId });
        } else {
          notify({ type: 'connection.restored', boardId, cardId });
        }
      });
    };

    socket.on('kanban:changed', changed);
    socket.on('kanban:access-revoked', revoked);
    socket.on('connect', synchronize);
    socket.on('realtime:ready', synchronize);
    if (socket.connected) {
      queueMicrotask(synchronize);
    }

    return () => {
      active = false;
      socket.off('kanban:changed', changed);
      socket.off('kanban:access-revoked', revoked);
      socket.off('connect', synchronize);
      socket.off('realtime:ready', synchronize);
      if (boardId && socket.connected) {
        socket.emit('kanban:unwatch', subscription);
      }
    };
  }, [socket, boardId, cardId]);
}
