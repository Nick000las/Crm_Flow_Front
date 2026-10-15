import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { escreverEstadoLista, lerEstadoLista } from '../lib/url-state';

/**
 * Estado da lista (busca, página, tamanho) guardado na URL: um link
 * compartilhado reabre a mesma visão, e voltar no navegador funciona.
 */
export function useEstadoLista() {
  const [searchParams, setSearchParams] = useSearchParams();
  const estado = useMemo(() => lerEstadoLista(searchParams), [searchParams]);

  /** @param {Partial<import('../lib/url-state').EstadoLista>} mudancas */
  const atualizar = useCallback(
    (mudancas) => setSearchParams((atuais) => escreverEstadoLista(atuais, mudancas)),
    [setSearchParams],
  );

  return { estado, atualizar };
}
