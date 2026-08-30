/**
 * @file Entrada suave para blocos, cabeçalhos e painéis de conteúdo. Mantém o conteúdo legível
 * e desativa a animação quando há preferência por movimento reduzido.
 */
import { motion, useReducedMotion } from 'motion/react';

import { MOTION_DURATION, MOTION_EASE } from './motion-tokens';

/**
 * Entrada suave para blocos, cabeçalhos e painéis de conteúdo.
 * Mantém o conteúdo legível e desativa a animação quando há preferência por movimento reduzido.
 */
export function FadeIn({
  children,
  className,
  delay = 0,
  y = 0,
  duration = MOTION_DURATION.standard,
  ...props
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0.9, y }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : duration,
        delay: reduceMotion ? 0 : delay,
        ease: MOTION_EASE,
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}
