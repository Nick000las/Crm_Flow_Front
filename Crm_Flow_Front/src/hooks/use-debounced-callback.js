import { useCallback, useEffect, useRef } from 'react';

/**
 * Versão "debounced" de `callback`: só dispara depois de `delayMs` sem nova
 * chamada. Debounce no evento (e não num valor observado por efeito) evita
 * que uma navegação externa — o botão voltar — seja desfeita por um valor
 * antigo ainda pendente.
 *
 * @template {unknown[]} A
 * @param {(...args: A) => void} callback
 * @param {number} delayMs
 */
export function useDebouncedCallback(callback, delayMs) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return useCallback(
    (...args) => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delayMs);
    },
    [delayMs],
  );
}
