import { useEffect, useState } from 'react';

/**
 * Vira `true` na primeira vez que o elemento aparece e não volta: serve para
 * adiar uma busca até ela ser necessária.
 *
 * @param {import('react').RefObject<Element | null>} ref
 */
export function useVisivelUmaVez(ref) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const alvo = ref.current;
    if (visivel || !alvo) {
      return undefined;
    }

    const observador = new IntersectionObserver(([entrada]) => {
      if (entrada.isIntersecting) {
        setVisivel(true);
      }
    });
    observador.observe(alvo);

    return () => observador.disconnect();
  }, [ref, visivel]);

  return visivel;
}
