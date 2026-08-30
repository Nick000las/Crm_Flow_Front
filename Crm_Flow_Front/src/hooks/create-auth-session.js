import api, { ApiError } from '@/services/api';
import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

/**
 * Fábrica de sessões autenticadas.
 *
 * Existe uma instância por área do produto — a do tenant e a master — e elas
 * são deliberadamente independentes: cada `createAuthSession` cria seu próprio
 * contexto, seu próprio estado e seus próprios refs. Nenhum token atravessa de
 * uma para a outra, então estar logado como tenant não dá acesso admin nem o
 * contrário. O que se compartilha aqui é só a mecânica (refresh single-flight,
 * retentativa única em 401), sutil demais para viver duplicada: um conserto de
 * corrida precisa valer para as duas sessões de uma vez.
 *
 * @param {{
 *   nome: string,
 *   resolverUsuario?: (accessToken: string, respostaLogin: unknown) => Promise<unknown>,
 * }} options `nome` compõe as mensagens de erro e o displayName do contexto.
 */
export function createAuthSession({
  nome,
  resolverUsuario = resolverUsuarioPadrao,
}) {
  const Context = createContext(null);
  Context.displayName = `${nome}Context`;

  function Provider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [mfaEnabled, setMfaEnabled] = useState(false);

    // Os tokens vivem apenas em memória — nada de localStorage/sessionStorage
    // nem cookie escrito pelo JS. Um F5 desloga, e isso é decisão consciente.
    // Como não há sessão persistida para restaurar (e `/auth/me` exige
    // Authorization: Bearer, o backend não lê cookie), não existe carregamento
    // inicial a esperar: `loading` já nasce resolvido. O campo continua no
    // contexto porque as rotas dependem dele como portão de renderização.
    const [loading] = useState(false);

    // Espelhos síncronos dos tokens: `withAuthRetry` roda dentro de closures
    // assíncronas e precisa do valor mais recente, não do capturado na
    // renderização em que a chamada começou.
    const accessTokenRef = useRef(null);
    const refreshTokenRef = useRef(null);
    const refreshPromiseRef = useRef(null);

    useEffect(() => {
      accessTokenRef.current = accessToken;
    }, [accessToken]);

    useEffect(() => {
      refreshTokenRef.current = refreshToken;
    }, [refreshToken]);

    const forceLogout = useCallback(() => {
      accessTokenRef.current = null;
      refreshTokenRef.current = null;
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setMfaEnabled(false);
    }, []);

    const authApi = useMemo(() => {
      async function doRefresh() {
        try {
          const response = await api.post('/auth/refresh', {
            refreshToken: refreshTokenRef.current,
          });
          const nextAccessToken = response?.accessToken ?? null;

          if (!nextAccessToken) {
            throw new Error('Resposta de refresh sem accessToken.');
          }

          accessTokenRef.current = nextAccessToken;
          setAccessToken(nextAccessToken);

          return nextAccessToken;
        } catch {
          forceLogout();
          return null;
        }
      }

      /**
       * Um refresh por vez. Se duas chamadas concorrentes tomarem 401 juntas,
       * ambas aguardam a mesma promise — disparar dois `/auth/refresh` faria a
       * segunda usar um refresh token que a primeira já consumiu (caso o
       * backend passe a rotacioná-lo), derrubando a sessão por corrida.
       */
      function refreshAccessToken() {
        if (!refreshPromiseRef.current) {
          refreshPromiseRef.current = doRefresh().finally(() => {
            refreshPromiseRef.current = null;
          });
        }

        return refreshPromiseRef.current;
      }

      async function withAuthRetry(invoke) {
        try {
          return await invoke(accessTokenRef.current);
        } catch (error) {
          if (
            error instanceof ApiError &&
            error.status === 401 &&
            refreshTokenRef.current
          ) {
            const nextAccessToken = await refreshAccessToken();

            // Exatamente uma retentativa: um segundo 401 propaga como erro.
            if (nextAccessToken) return invoke(nextAccessToken);
          }

          throw error;
        }
      }

      return {
        get: (path, options = {}) =>
          withAuthRetry((token) =>
            api.get(path, { ...options, accessToken: token }),
          ),
        post: (path, json, options = {}) =>
          withAuthRetry((token) =>
            api.post(path, json, { ...options, accessToken: token }),
          ),
        put: (path, json, options = {}) =>
          withAuthRetry((token) =>
            api.put(path, json, { ...options, accessToken: token }),
          ),
        patch: (path, json, options = {}) =>
          withAuthRetry((token) =>
            api.patch(path, json, { ...options, accessToken: token }),
          ),
        delete: (path, options = {}) =>
          withAuthRetry((token) =>
            api.delete(path, { ...options, accessToken: token }),
          ),
      };
    }, [forceLogout]);

    /**
     * @param {unknown} authData resposta final do login (com os tokens)
     * @param {{ mfaVerified?: boolean }} [options] se a sessão passou pelo
     *   desafio de MFA — única fonte confiável do estado de MFA hoje, já que
     *   `/auth/me` não devolve `mfaAtivo`.
     */
    const login = useCallback(
      async (authData, { mfaVerified = false } = {}) => {
        const nextAccessToken = getResponseAccessToken(authData);
        const nextRefreshToken = getResponseRefreshToken(authData);

        accessTokenRef.current = nextAccessToken;
        refreshTokenRef.current = nextRefreshToken;
        setAccessToken(nextAccessToken);
        setRefreshToken(nextRefreshToken);

        let nextUser;

        try {
          nextUser = await resolverUsuario(nextAccessToken, authData);
        } catch (error) {
          // A sessão só passa a existir se o usuário for aceito. Descartar os
          // tokens aqui é o que impede uma conta sem permissão de ficar
          // "logada" e só apanhar 403 na primeira tela que abrir.
          forceLogout();
          throw error;
        }

        setUser(nextUser);
        setMfaEnabled(mfaVerified);

        return nextUser;
      },
      [forceLogout],
    );

    const logout = useCallback(async () => {
      try {
        await api.post('/auth/logout', undefined, { accessToken });
      } catch {
        // A sessão é encerrada localmente de qualquer forma: os tokens são
        // stateless e só existem neste processo.
      } finally {
        forceLogout();
      }
    }, [accessToken, forceLogout]);

    const value = useMemo(
      () => ({
        user,
        accessToken,
        authApi,
        login,
        logout,
        loading,
        mfaEnabled,
        syncMfaEnabled: setMfaEnabled,
        isAuthenticated: Boolean(user),
      }),
      [user, accessToken, authApi, login, logout, loading, mfaEnabled],
    );

    // `authApi` fecha sobre os refs de token, mas só os lê dentro de callbacks
    // assíncronas (a retentativa após 401), nunca durante a renderização.
    return createElement(Context.Provider, { value }, children);
  }

  Provider.displayName = `${nome}Provider`;

  function useSession() {
    const context = useContext(Context);

    if (!context) {
      throw new Error(`use${nome} deve ser usado dentro de ${nome}Provider.`);
    }

    return context;
  }

  return { Context, Provider, useSession };
}

/**
 * Resolução padrão: aproveita o usuário que já veio na resposta do login e só
 * consulta `/auth/me` quando ele não veio.
 */
async function resolverUsuarioPadrao(accessToken, respostaLogin) {
  const usuario = getResponseUser(respostaLogin);

  if (usuario) return usuario;

  const response = await api.get('/auth/me', { accessToken });

  return getResponseUser(response);
}

export function getResponseUser(response) {
  if (!response || typeof response !== 'object') return null;

  return response.user ?? response.session?.user ?? null;
}

export function getResponseAccessToken(response) {
  if (!response || typeof response !== 'object') return null;

  return response.accessToken ?? response.tokens?.accessToken ?? null;
}

export function getResponseRefreshToken(response) {
  if (!response || typeof response !== 'object') return null;

  return response.refreshToken ?? response.tokens?.refreshToken ?? null;
}
