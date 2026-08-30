import { useEffect, useState } from 'react';
import { isAbortError, toApiError } from '@/services/api';

/**
 * `GET /auth/settings` — diferente de `/auth/me` (que só ecoa o payload do
 * JWT), essa rota consulta o banco na hora e é a única fonte confiável de
 * `mfaAtivo`: esse campo nunca viaja dentro do token.
 *
 * @param {{ get(path: string, options?: object): Promise<unknown> }} authApi
 * @returns {{
 *   settings: { nome: string, email: string, role: string, mfaAtivo: boolean } | null,
 *   carregando: boolean,
 *   erro: import('@/services/api-error').ApiError | null,
 * }}
 */
export function useAuthSettings(authApi) {
  const [state, setState] = useState({
    settings: null,
    carregando: true,
    erro: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    authApi
      .get('/auth/settings', { signal: controller.signal })
      .then((settings) => {
        if (!controller.signal.aborted) {
          setState({ settings, carregando: false, erro: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isAbortError(error)) {
          setState({
            settings: null,
            carregando: false,
            erro: toApiError(error),
          });
        }
      });

    return () => controller.abort();
  }, [authApi]);

  return state;
}
