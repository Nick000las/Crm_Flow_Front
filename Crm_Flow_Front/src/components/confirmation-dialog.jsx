/**
 * @file Confirmação compartilhada. Renderiza na top layer para funcionar também quando a ação
 * parte de um editor que já usa <dialog>.
 */
import './confirmation-dialog.css';

import { useId, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { NativeDialog } from '@/components/ui/native-dialog';

/**
 * Confirmação compartilhada. Renderiza na top layer para funcionar também
 * quando a ação parte de um editor que já usa <dialog>. O chamador monta o
 * componente ao selecionar o recurso; nenhuma mutação acontece ao abrir.
 * onConfirm pode retornar false para manter o modal aberto com erro externo.
 */
export function ConfirmationDialog({
  title,
  description,
  confirmLabel = 'Excluir',
  pendingLabel = 'Excluindo…',
  cancelLabel = 'Cancelar',
  busy = false,
  error,
  onConfirm,
  onClose,
}) {
  const id = useId();
  const cancel = useRef(null);
  const inFlight = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const pending = busy || submitting;
  const message = error || submitError;

  async function confirm() {
    if (pending || inFlight.current) {
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    setSubmitError('');

    try {
      const result = await onConfirm();

      if (result !== false) {
        onClose();
      }
    } catch (error) {
      setSubmitError(error.message || 'Não foi possível concluir a ação. Tente novamente.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return createPortal(
    <NativeDialog
      initialFocusRef={cancel}
      className="confirmation-dialog"
      role="alertdialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={pending}
      onCancel={(event) => {
        event.preventDefault();

        if (!pending) {
          onClose();
        }
      }}
    >
      <div className="confirmation-dialog-content">
        <div className="confirmation-dialog-icon">
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <h2 id={`${id}-title`}>{title}</h2>
        <p id={`${id}-description`}>{description}</p>
        {message && (
          <p role="alert" className="confirmation-dialog-error">
            {message}
          </p>
        )}
      </div>
      <Form
        className="confirmation-dialog-footer"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          confirm();
        }}
      >
        <Button ref={cancel} type="button" variant="outline" disabled={pending} onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button type="submit" variant="destructive" loading={pending} disabled={pending}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </Form>
    </NativeDialog>,
    document.body,
  );
}
