import { useCallback, useEffect, useState } from 'react';
import { isAbortError, toApiError } from '@/services/api';

/**
 * `GET /admin/tenants` — listagem da área master.
 *
 * Diferente de `useAuthSettings`, expõe um `recarregar()`: toda mutação de
 * tenant precisa refazer a busca, e sem essa saída cada tela teria que manter
 * sua própria cópia da lista em estado local.
 *
 * A recarga não volta para `carregando` de propósito — a lista atual continua
 * na tela enquanto a nova chega, em vez de piscar para um texto de espera.
 *
 * @param {{ get(path: string, options?: object): Promise<unknown> }} adminApi
 */
export function useTenants(adminApi) {
  const [state, setState] = useState({
    tenants: null,
    carregando: true,
    erro: null,
  });
  const [revalidacao, setRevalidacao] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    adminApi
      .get('/admin/tenants', { signal: controller.signal })
      .then((resposta) => {
        if (!controller.signal.aborted) {
          setState({
            tenants: normalizarLista(resposta),
            carregando: false,
            erro: null,
          });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isAbortError(error)) {
          setState({
            tenants: null,
            carregando: false,
            erro: toApiError(error),
          });
        }
      });

    return () => controller.abort();
  }, [adminApi, revalidacao]);

  const recarregar = useCallback(() => {
    setRevalidacao((atual) => atual + 1);
  }, []);

  return { ...state, recarregar };
}

/**
 * A rota devolve o array direto dentro do envelope `{ statusCode, data }`, e o
 * `unwrapResponseData` do cliente HTTP já tira essa camada — então aqui chega
 * `Tenant[]`. A guarda existe só para a tela não quebrar caso a resposta venha
 * fora do formato; não há coleção embrulhada nem paginação a tratar.
 */
function normalizarLista(resposta) {
  return Array.isArray(resposta) ? resposta : [];
}
