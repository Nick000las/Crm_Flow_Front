import { useEffect, useState } from 'react';
import { apiRequest } from '../../../services/api.js';

/**
 * Hook de dado do módulo CRM — chama o backend, nunca importa de outro módulo.
 * @param {string | null | undefined} accessToken
 */
export function useLeads(accessToken) {
  const [result, setResult] = useState(() => ({
    accessToken,
    leads: /** @type {import('../types.js').Lead[]} */ ([]),
    carregando: true,
    erro: null,
  }));

  useEffect(() => {
    if (!accessToken) return undefined;

    const controller = new AbortController();

    apiRequest('/crm/leads', {
      accessToken,
      signal: controller.signal,
    })
      .then((data) => {
        if (!controller.signal.aborted) {
          setResult({
            accessToken,
            leads: data,
            carregando: false,
            erro: null,
          });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            accessToken,
            leads: [],
            carregando: false,
            erro: error.message,
          });
        }
      });

    return () => controller.abort();
  }, [accessToken]);

  if (!accessToken) {
    return { leads: [], carregando: false, erro: null };
  }

  if (result.accessToken !== accessToken) {
    return { leads: [], carregando: true, erro: null };
  }

  return {
    leads: result.leads,
    carregando: result.carregando,
    erro: result.erro,
  };
}
