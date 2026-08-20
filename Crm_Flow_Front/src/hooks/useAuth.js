import api from '@/services/api';
import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
} from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadUser() {
      try {
        const response = await api.get('/auth/me', {
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setUser(getResponseUser(response));
        }
      } catch {
        if (!controller.signal.aborted) {
          setUser(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => controller.abort();
  }, []);

  async function login(authData) {
    const nextAccessToken = getResponseAccessToken(authData);
    let nextUser = getResponseUser(authData);

    if (!nextUser) {
      const response = await api.get('/auth/me', {
        accessToken: nextAccessToken,
      });
      nextUser = getResponseUser(response);
    }

    setAccessToken(nextAccessToken);
    setUser(nextUser);

    return nextUser;
  }

  async function logout() {
    await api.post('/auth/logout', undefined, { accessToken });

    setUser(null);
    setAccessToken(null);
  }

  return createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        accessToken,
        login,
        logout,
        loading,
        isAuthenticated: Boolean(user),
      },
    },
    children,
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}

function getResponseUser(response) {
  if (!response || typeof response !== 'object') return null;

  return response.user ?? response.session?.user ?? null;
}

function getResponseAccessToken(response) {
  if (!response || typeof response !== 'object') return null;

  return response.accessToken ?? response.tokens?.accessToken ?? null;
}
