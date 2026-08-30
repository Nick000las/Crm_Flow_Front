import { useEffect } from 'react';
import { useAnimate, useReducedMotion } from 'motion/react';
import { TRANSITION_FAST } from './motion-tokens';

/** Mantém conteúdo e foco disponíveis durante a troca, sem remontar os filhos. */
export function ContentTransition({ transitionKey, children, className }) {
  const [scope, animate] = useAnimate();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!scope.current || reduceMotion) {
      return undefined;
    }

    const controls = animate(scope.current, { opacity: [0.9, 1] }, TRANSITION_FAST);
    return () => controls.complete();
  }, [transitionKey, reduceMotion, scope, animate]);

  return (
    <div ref={scope} className={className}>
      {children}
    </div>
  );
}
