import { useEffect, useState } from 'react';
import { isAbortError, toApiError } from '@/services/api';

/**
 * `GET /admin/features` — catálogo de feature flags que os módulos do back
 * declaram (`{ moduleKey, featureKey }[]`). Vem do back pelo mesmo motivo
 * do catálogo de módulos: uma lista fixa aqui envelheceria a cada marco.
 *
 * @param {{ get(path: string, options?: object): Promise<unknown> }} adminApi
 */
export function useFeatureCatalog(adminApi) {
  const [state, setState] = useState({
    catalogo: [],
    carregando: true,
    erro: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    adminApi
      .get('/admin/features', { signal: controller.signal })
      .then((catalogo) => {
        if (!controller.signal.aborted) {
          setState({ catalogo, carregando: false, erro: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isAbortError(error)) {
          setState({ catalogo: [], carregando: false, erro: toApiError(error) });
        }
      });

    return () => controller.abort();
  }, [adminApi]);

  return state;
}
