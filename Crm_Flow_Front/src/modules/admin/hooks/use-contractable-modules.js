import { useEffect, useState } from 'react';
import { getBackendHealth, isAbortError, toApiError } from '@/services/api';

/**
 * Catálogo de módulos contratáveis. A fonte é `GET /health`, que já devolve
 * `modules: string[]` e é validado por `getBackendHealth` — assim a lista
 * acompanha o backend em vez de viver como constante desatualizada no front.
 *
 * As chaves são exibidas como vêm: o backend nomeia os módulos, e traduzir
 * aqui criaria um segundo lugar para manter sincronizado.
 */
export function useContractableModules() {
  const [state, setState] = useState({
    modulos: [],
    carregando: true,
    erro: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    getBackendHealth({ signal: controller.signal })
      .then((health) => {
        if (!controller.signal.aborted) {
          setState({ modulos: health.modules, carregando: false, erro: null });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted && !isAbortError(error)) {
          setState({ modulos: [], carregando: false, erro: toApiError(error) });
        }
      });

    return () => controller.abort();
  }, []);

  return state;
}
