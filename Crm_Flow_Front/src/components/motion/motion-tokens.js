/**
 * @file Renderiza motion tokens, na área de aplicação, expondo os estados e eventos necessários
 * à interface.
 */
export const MOTION_EASE = [0.2, 0, 0, 1];

export const MOTION_DURATION = Object.freeze({
  fast: 0.12,
  standard: 0.18,
  slow: 0.22,
});

export const TRANSITION_FAST = Object.freeze({
  duration: MOTION_DURATION.fast,
  ease: MOTION_EASE,
});

export const TRANSITION_STANDARD = Object.freeze({
  duration: MOTION_DURATION.standard,
  ease: MOTION_EASE,
});

export const TRANSITION_SLOW = Object.freeze({
  duration: MOTION_DURATION.slow,
  ease: MOTION_EASE,
});

export const MODAL_ENTER = Object.freeze({ duration: 0.24, ease: MOTION_EASE });
export const MODAL_EXIT = Object.freeze({ duration: 0.22, ease: [0.4, 0, 0.6, 1] });
export const MODAL_HIDDEN = Object.freeze({ opacity: 0, y: 12 });
export const MODAL_VISIBLE = Object.freeze({ opacity: 1, y: 0 });
