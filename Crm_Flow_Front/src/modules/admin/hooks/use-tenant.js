import { useCallback, useEffect, useState } from 'react';
import { isAbortError, toApiError } from '@/services/api';

/**
 * `GET /admin/tenants/:id` — detalhe de um tenant, com `recarregar()` para as
 * seções chamarem depois de cada mutação.
 *
 * @param {{ get(path: string, options?: object): Promise<unknown> }} adminApi
 * @param {string} tenantId
 */
export function useTenant(adminApi, tenantId) {
  const [state, setState] = useState({
    tenant: null,
    tenantId,
    carregando: true,
    erro: null,
    revision: -1,
  });
  const [revalidacao, setRevalidacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    adminApi
      .get(`/admin/tenants/${tenantId}`, { signal: controller.signal })
      .then((tenant) => {
        if (!controller.signal.aborted) {
          setState({ tenant, tenantId, carregando: false, erro: null, revision: revalidacao });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isAbortError(error)) {
          setState((current) => ({
            tenant: current.tenantId === tenantId ? current.tenant : null,
            tenantId,
            carregando: false,
            erro: toApiError(error),
            revision: revalidacao,
          }));
        }
      });

    return () => controller.abort();
  }, [adminApi, tenantId, revalidacao]);

  const recarregar = useCallback(() => {
    setRevalidacao((atual) => atual + 1);
  }, []);

  if (state.tenantId !== tenantId) {
    return { tenant: null, carregando: true, atualizando: false, erro: null, recarregar };
  }

  return { ...state, atualizando: !state.carregando && state.revision !== revalidacao, recarregar };
}
