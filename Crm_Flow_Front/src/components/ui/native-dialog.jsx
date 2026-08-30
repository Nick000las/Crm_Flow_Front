/**
 * @file Preserva a top layer, o foco e o bloqueio do fundo até o fim da saída.
 */
import { useLayoutEffect, useRef } from 'react';
import { motion, useIsPresent, useReducedMotion } from 'motion/react';

import {
  MODAL_ENTER,
  MODAL_EXIT,
  MODAL_HIDDEN,
  MODAL_VISIBLE,
} from '@/components/motion/motion-tokens';

const focusOrigins = new WeakMap();

function restoreFocus(element, origins) {
  const active = document.activeElement;

  if (
    active &&
    active !== document.body &&
    !element.contains(active) &&
    !active.closest('dialog[data-closing]')
  ) {
    return;
  }

  const target = origins.find(
    (origin) =>
      origin?.isConnected &&
      typeof origin.focus === 'function' &&
      !origin.matches(':disabled') &&
      !origin.closest('[inert], dialog[data-closing]'),
  );

  if (!target) {
    return;
  }

  const topDialog = Array.from(document.querySelectorAll('dialog[open]')).at(-1);

  if (!topDialog || topDialog.contains(target)) {
    target.focus({ preventScroll: true });
  }
}

/** Preserva a top layer, o foco e o bloqueio do fundo até o fim da saída. */
export function NativeDialog({ initialFocusRef, children, onCancel, ...props }) {
  const dialog = useRef(null);
  const present = useIsPresent();
  const reduceMotion = useReducedMotion();

  useLayoutEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const parentDialog = previousFocus?.closest('dialog[open]');
    const origins = [previousFocus, ...(focusOrigins.get(parentDialog) ?? [])];

    focusOrigins.set(element, origins);
    element.showModal();

    const initialFocus =
      initialFocusRef?.current ??
      element.querySelector(
        'input:not([type="checkbox"]):not([type="hidden"]):not(:disabled), textarea:not(:disabled)',
      );

    initialFocus?.focus({ preventScroll: true });

    return () => {
      element.close();
      restoreFocus(element, origins);
    };
  }, [initialFocusRef]);

  function blockDuringExit(event) {
    if (!present) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  return (
    <motion.dialog
      {...props}
      ref={dialog}
      data-closing={!present || undefined}
      initial={reduceMotion ? false : MODAL_HIDDEN}
      animate={MODAL_VISIBLE}
      exit={{ ...MODAL_HIDDEN, transition: reduceMotion ? { duration: 0 } : MODAL_EXIT }}
      transition={reduceMotion ? { duration: 0 } : MODAL_ENTER}
      onClickCapture={blockDuringExit}
      onKeyDownCapture={blockDuringExit}
      onSubmitCapture={blockDuringExit}
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (present) {
          onCancel?.(event);
        }
      }}
    >
      {children}
    </motion.dialog>
  );
}
