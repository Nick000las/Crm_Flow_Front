/**
 * @file Formulário nativo com foco preservado após envio e Ctrl/Cmd+Enter para salvar.
 */
import { useEffect, useImperativeHandle, useRef } from 'react';

import { isComposingKeyEvent } from '@/lib/keyboard-shortcuts';

/** Formulário nativo com foco preservado após envio e Ctrl/Cmd+Enter para salvar. */
export function Form({
  ref,
  onFocusCapture,
  onKeyDown,
  onSubmit,
  submitOnEnter = false,
  ...props
}) {
  const formRef = useRef(null);
  const focusedControl = useRef(null);
  const pendingFocus = useRef(null);

  useImperativeHandle(ref, () => formRef.current, []);

  useEffect(() => {
    const form = formRef.current;
    const observer = new MutationObserver(() => {
      const control = focusedControl.current;

      if (!control?.isConnected || !form.contains(control)) {
        pendingFocus.current = null;

        return;
      }

      if (control.matches(':disabled')) {
        pendingFocus.current = control;

        return;
      }

      if (pendingFocus.current === control) {
        pendingFocus.current = null;

        // Não rouba o foco se o usuário foi para outro controle durante a requisição.
        if (document.activeElement === document.body) {
          control.focus({ preventScroll: true });
        }
      }
    });

    observer.observe(form, { subtree: true, attributes: true, attributeFilter: ['disabled'] });

    return () => observer.disconnect();
  }, []);

  function handleKeyDown(event) {
    onKeyDown?.(event);

    if (event.defaultPrevented || isComposingKeyEvent(event) || event.key !== 'Enter') {
      return;
    }

    if (event.repeat && (event.target.tagName !== 'TEXTAREA' || event.ctrlKey || event.metaKey)) {
      event.preventDefault();

      return;
    }

    const singleLineEnter = submitOnEnter && event.target.matches('input:not([role="combobox"])');

    if ((!singleLineEnter && !event.ctrlKey && !event.metaKey) || event.altKey || event.shiftKey) {
      return;
    }

    if (!event.target.matches('input:not([role="combobox"]), textarea')) {
      return;
    }

    const submitter = Array.from(formRef.current.elements).find(
      (element) => element.type === 'submit' && !element.matches(':disabled'),
    );

    if (submitter) {
      event.preventDefault();
      formRef.current.requestSubmit(submitter);
    }
  }

  return (
    <form
      {...props}
      ref={formRef}
      onFocusCapture={(event) => {
        focusedControl.current = event.target;
        pendingFocus.current = null;
        onFocusCapture?.(event);
      }}
      onKeyDown={handleKeyDown}
      onSubmit={onSubmit}
    />
  );
}
