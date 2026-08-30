/**
 * @file Mantém o diálogo montado até terminar a saída, inclusive em confirmações aninhadas.
 */
import { AnimatePresence } from 'motion/react';

/** Mantém o diálogo montado até terminar a saída, inclusive em confirmações aninhadas. */
export function ModalPresence({ children }) {
  return <AnimatePresence propagate>{children}</AnimatePresence>;
}
