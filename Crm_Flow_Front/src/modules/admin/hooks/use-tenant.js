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
    carregando: true,
    erro: null,
  });
  const [revalidacao, setRevalidacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    adminApi
      .get(`/admin/tenants/${tenantId}`, { signal: controller.signal })
      .then((tenant) => {
        if (!controller.signal.aborted) {
          setState({ tenant, carregando: false, erro: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isAbortError(error)) {
          setState({ tenant: null, carregando: false, erro: toApiError(error) });
        }
      });

    return () => controller.abort();
  }, [adminApi, tenantId, revalidacao]);

  const recarregar = useCallback(() => {
    setRevalidacao((atual) => atual + 1);
  }, []);

  return { ...state, recarregar };
}
