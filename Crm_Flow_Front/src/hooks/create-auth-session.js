import api, { ApiError } from '../services/api.js';
import { restoreSession } from '../services/session.js';
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
 * Cliente autenticado exposto pela sessão: mesmos métodos de `api`, com o
 * token injetado e uma retentativa após refresh em 401.
 *
 * @typedef {Object} AuthApi
 * @property {(path: string, options?: object) => Promise<any>} get
 * @property {(path: string, json?: unknown, options?: object) => Promise<any>} post
 * @property {(path: string, json?: unknown, options?: object) => Promise<any>} put
 * @property {(path: string, json?: unknown, options?: object) => Promise<any>} patch
 * @property {(path: string, options?: object) => Promise<any>} delete
 * @property {(path: string, formData: FormData, options?: object) => Promise<any>} upload
 * @property {(path: string, json?: unknown, options?: object) => Promise<{ blob: Blob, filename: string | null }>} download
 * @property {() => Promise<string | null>} refreshAccessToken
 */

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
 *   persistente?: boolean,
 *   sessionScope?: 'tenant' | 'admin',
 *   onSessionChange?: () => void,
 * }} options `nome` compõe as mensagens de erro e o displayName do contexto.
 *   `persistente`: o refresh token mora num cookie httpOnly gravado pelo back
 *   (o JS nunca o vê); ao montar, a sessão tenta se restaurar por ele, então
 *   um F5 não desloga.
 */
export function createAuthSession({
  nome,
  resolverUsuario = resolverUsuarioPadrao,
  persistente = false,
  sessionScope = 'tenant',
  onSessionChange = () => {},
}) {
  const Context = createContext(null);
  Context.displayName = `${nome}Context`;

  function Provider({ children }) {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(null);
    const [refreshToken, setRefreshToken] = useState(null);
    const [mfaEnabled, setMfaEnabled] = useState(false);

    // Nenhum token é escrito pelo JS — nada de localStorage/sessionStorage.
    // O access token vive só em memória. Cada sessão persistente tem seu próprio
    // refresh token num cookie httpOnly do back e começa carregando: só sabe
    // se há sessão depois de consultar /me. Tenant e admin usam cookies distintos.
    const [loading, setLoading] = useState(persistente);
    const [sessionError, setSessionError] = useState(null);
    const [restorationAttempt, setRestorationAttempt] = useState(0);
    const restauracaoIniciadaRef = useRef(-1);
    const sessionRevision = useRef(0);

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
      sessionRevision.current += 1;
      onSessionChange();
      accessTokenRef.current = null;
      refreshTokenRef.current = null;
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setMfaEnabled(false);
      setSessionError(null);
    }, []);

    const retrySession = useCallback(() => {
      sessionRevision.current += 1;
      setSessionError(null);
      setLoading(true);
      setRestorationAttempt((attempt) => attempt + 1);
    }, []);

    const authApi = useMemo(() => {
      async function doRefresh() {
        const revision = sessionRevision.current;
        try {
          // Sem refresh em memória (sessão persistente), o corpo vai vazio e
          // o back usa o cookie httpOnly.
          const response = await api.post('/auth/refresh', {
            scope: sessionScope,
            refreshToken: refreshTokenRef.current ?? undefined,
          });
          const nextAccessToken = response?.accessToken ?? null;

          if (revision !== sessionRevision.current) {
            return null;
          }

          if (!nextAccessToken) {
            throw new ApiError('Resposta de refresh sem accessToken.', {
              status: 401,
              code: 'AUTH_TOKEN_INVALID',
            });
          }

          accessTokenRef.current = nextAccessToken;
          setAccessToken(nextAccessToken);

          return nextAccessToken;
        } catch (error) {
          if (
            revision === sessionRevision.current &&
            error instanceof ApiError &&
            (error.status === 401 || error.status === 403)
          ) {
            forceLogout();
          }
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
        const revision = sessionRevision.current;
        const originalToken = accessTokenRef.current;
        function assertCurrentSession() {
          if (revision !== sessionRevision.current) {
            throw new DOMException('A sessão foi alterada.', 'AbortError');
          }
        }
        async function invokeForSession(token) {
          assertCurrentSession();
          const response = await invoke(token);
          assertCurrentSession();
          return response;
        }
        try {
          return await invokeForSession(originalToken);
        } catch (error) {
          assertCurrentSession();
          const podeRenovar = persistente || Boolean(refreshTokenRef.current);

          if (error instanceof ApiError && error.status === 401 && podeRenovar) {
            const nextAccessToken =
              accessTokenRef.current && accessTokenRef.current !== originalToken
                ? accessTokenRef.current
                : await refreshAccessToken();

            // Exatamente uma retentativa: um segundo 401 propaga como erro.
            if (nextAccessToken) {
              try {
                return await invokeForSession(nextAccessToken);
              } catch (retryError) {
                if (
                  revision === sessionRevision.current &&
                  retryError instanceof ApiError &&
                  retryError.status === 401
                ) {
                  forceLogout();
                }
                throw retryError;
              }
            }
          }

          throw error;
        }
      }

      return {
        refreshAccessToken,
        get: (path, options = {}) =>
          withAuthRetry((token) => api.get(path, { ...options, accessToken: token })),
        post: (path, json, options = {}) =>
          withAuthRetry((token) => api.post(path, json, { ...options, accessToken: token })),
        put: (path, json, options = {}) =>
          withAuthRetry((token) => api.put(path, json, { ...options, accessToken: token })),
        patch: (path, json, options = {}) =>
          withAuthRetry((token) => api.patch(path, json, { ...options, accessToken: token })),
        delete: (path, options = {}) =>
          withAuthRetry((token) => api.delete(path, { ...options, accessToken: token })),
        /** Multipart (ex.: planilha de import). Ver `api.upload`. */
        upload: (path, formData, options = {}) =>
          withAuthRetry((token) => api.upload(path, formData, { ...options, accessToken: token })),
        /** Resposta binária (ex.: export). Retorna `{ blob, filename }`. */
        download: (path, json, options = {}) =>
          withAuthRetry((token) => api.download(path, json, { ...options, accessToken: token })),
      };
    }, [forceLogout]);

    /**
     * @param {unknown} authData resposta final do login (com os tokens)
     * @param {{ mfaVerified?: boolean }} [options] fallback para respostas
     *   antigas sem `mfaAtivo`; a consulta atual de `/me` tem prioridade.
     */
    const login = useCallback(
      async (authData, { mfaVerified = false } = {}) => {
        const revision = ++sessionRevision.current;
        const nextAccessToken = getResponseAccessToken(authData);
        const nextRefreshToken = getResponseRefreshToken(authData);
        if (typeof nextAccessToken !== 'string' || !nextAccessToken) {
          throw new ApiError('Resposta de login inválida.', {
            status: 401,
            code: 'AUTH_TOKEN_INVALID',
          });
        }
        onSessionChange();

        accessTokenRef.current = nextAccessToken;
        refreshTokenRef.current = nextRefreshToken;
        setAccessToken(nextAccessToken);
        setRefreshToken(nextRefreshToken);

        let nextUser;

        try {
          nextUser = await resolverUsuario(nextAccessToken, authData);
          if (!nextUser || typeof nextUser !== 'object') {
            throw new ApiError('Usuário da sessão inválido.', {
              status: 401,
              code: 'AUTH_TOKEN_INVALID',
            });
          }
        } catch (error) {
          // A sessão só passa a existir se o usuário for aceito. Descartar os
          // tokens aqui é o que impede uma conta sem permissão de ficar
          // "logada" e só apanhar 403 na primeira tela que abrir.
          if (revision === sessionRevision.current) {
            forceLogout();
          }
          throw error;
        }

        if (revision !== sessionRevision.current) {
          throw new DOMException('A sessão foi alterada.', 'AbortError');
        }

        setUser(nextUser);
        setSessionError(null);
        setMfaEnabled(nextUser?.mfaAtivo ?? mfaVerified);
        setLoading(false);

        return nextUser;
      },
      [forceLogout],
    );

    useEffect(() => {
      // Ref e não estado: o StrictMode monta o efeito duas vezes em dev, e a
      // restauração deve rodar uma só.
      if (!persistente || restauracaoIniciadaRef.current === restorationAttempt) {
        return;
      }
      restauracaoIniciadaRef.current = restorationAttempt;

      async function restaurarSessao() {
        const revision = sessionRevision.current;
        try {
          const response = await restoreSession(sessionScope);
          if (revision !== sessionRevision.current) {
            return;
          }
          if (!response) {
            forceLogout();
            return;
          }
          onSessionChange();
          accessTokenRef.current = response.accessToken;
          setAccessToken(response.accessToken);
          setUser(response.user);
          setMfaEnabled(Boolean(response.user.mfaAtivo));
        } catch (error) {
          if (revision === sessionRevision.current) {
            if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
              forceLogout();
            } else {
              setSessionError(error);
            }
          }
        } finally {
          if (restauracaoIniciadaRef.current === restorationAttempt) {
            setLoading(false);
          }
        }
      }

      restaurarSessao();
    }, [forceLogout, restorationAttempt]);

    const logout = useCallback(async () => {
      // Invalida restaurações e refreshes ainda pendentes antes do HTTP.
      sessionRevision.current += 1;
      try {
        await authApi.post('/auth/logout', { scope: sessionScope });
      } catch {
        // A sessão é encerrada localmente de qualquer forma: os tokens são
        // stateless e só existem neste processo.
      } finally {
        forceLogout();
      }
    }, [authApi, forceLogout]);

    const value = useMemo(
      () => ({
        user,
        accessToken,
        authApi,
        login,
        logout,
        loading,
        sessionError,
        retrySession,
        mfaEnabled,
        syncMfaEnabled: setMfaEnabled,
        isAuthenticated: Boolean(user),
      }),
      [user, accessToken, authApi, login, logout, loading, sessionError, retrySession, mfaEnabled],
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

  if (usuario) {
    return usuario;
  }

  const response = await api.get('/auth/me', { accessToken });

  return getResponseUser(response);
}

export function getResponseUser(response) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  return response.user ?? response.session?.user ?? null;
}

export function getResponseAccessToken(response) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  return response.accessToken ?? response.tokens?.accessToken ?? null;
}

export function getResponseRefreshToken(response) {
  if (!response || typeof response !== 'object') {
    return null;
  }

  return response.refreshToken ?? response.tokens?.refreshToken ?? null;
}
