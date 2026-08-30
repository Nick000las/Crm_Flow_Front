/**
 * @file Evita flash de skeleton em carregamentos muito rápidos (cache ou rede local).
 */
import { useEffect, useState } from 'react';

/**
 * Só retorna `true` se `loading` continuar ativo após `delayMs`.
 *
 * @param {boolean} loading
 * @param {number} [delayMs=120]
 */
export function useDelayedLoading(loading, delayMs = 120) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!loading) {
      return undefined;
    }

    const timer = window.setTimeout(() => setVisible(true), delayMs);

    return () => {
      window.clearTimeout(timer);
      setVisible(false);
    };
  }, [loading, delayMs]);

  return loading && visible;
}
