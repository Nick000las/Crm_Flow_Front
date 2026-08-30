import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { API_BASE_URL } from '@/services/api';
import { KanbanRealtimeContext } from '../lib/kanban-realtime-context';

const RECONNECT_DELAY_MS = 3000;

export function KanbanRealtimeProvider({ children }) {
  const { accessToken, authApi } = useAuth();
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('connecting');

  useEffect(() => {
    let active = true;
    let connection;
    let retry;
    let refreshing = false;

    async function refreshSession() {
      if (refreshing || !active) {
        return;
      }
      refreshing = true;
      const token = await authApi.refreshAccessToken();
      if (!active) {
        return;
      }
      refreshing = false;
      if (token) {
        connection.auth = { accessToken: token };
        connection.connect();
      } else {
        setStatus('unavailable');
      }
    }

    import('socket.io-client')
      .then(({ io }) => {
        if (!active || !accessToken) {
          return;
        }
        const url = new URL(API_BASE_URL);
        connection = io(`${url.origin}/kanban`, {
          path: `${url.pathname.replace(/\/$/, '')}/socket.io`,
          auth: { accessToken },
          transports: ['websocket'],
          autoConnect: false,
          forceNew: true,
        });
        setSocket(connection);
        setStatus('connecting');
        connection.on('connect', () => setStatus('connected'));
        connection.on('disconnect', () => setStatus('reconnecting'));
        connection.on('realtime:unavailable', () => setStatus('reconnecting'));
        connection.on('realtime:ready', () => setStatus('connected'));
        connection.on('kanban:session-expired', refreshSession);
        connection.on('connect_error', (error) => {
          if (error.data?.code === 'AUTH_TOKEN_INVALID') {
            setStatus('reconnecting');
            void refreshSession();
          } else if (error.data?.code === 'FORBIDDEN') {
            setStatus('unavailable');
          } else {
            setStatus('reconnecting');
            if (error.data?.code === 'REALTIME_UNAVAILABLE') {
              clearTimeout(retry);
              retry = window.setTimeout(() => {
                if (active) {
                  connection.connect();
                }
              }, RECONNECT_DELAY_MS);
            }
          }
        });
        connection.connect();
      })
      .catch(() => {
        if (active) {
          setStatus('unavailable');
        }
      });

    return () => {
      active = false;
      window.clearTimeout(retry);
      connection?.disconnect();
      connection?.removeAllListeners();
    };
  }, [accessToken, authApi]);

  const value = useMemo(() => ({ socket, status }), [socket, status]);
  return <KanbanRealtimeContext.Provider value={value}>{children}</KanbanRealtimeContext.Provider>;
}
