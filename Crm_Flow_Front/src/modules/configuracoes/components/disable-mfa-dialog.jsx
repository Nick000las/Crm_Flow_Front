/**
 * @file Desligar o MFA exige a senha de novo — reduzir a proteção não pode depender só de um
 * access token válido (regra do backend em `DELETE /auth/mfa`).
 */
import { useState } from 'react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { focusFirstInvalidField, validateRequired } from '@/lib/form-validation';
import { getFieldError, isAbortError, toApiError } from '@/services/api';

const PASSWORD_ERROR_ID = 'disable-mfa-password-error';
const SUBMIT_ERROR_ID = 'disable-mfa-submit-error';

/**
 * Desligar o MFA exige a senha de novo — reduzir a proteção não pode
 * depender só de um access token válido (regra do backend em `DELETE /auth/mfa`).
 */
export function DisableMfaDialog({ open, onOpenChange, authApi, onDisabled }) {
  const [submitError, setSubmitError] = useState(null);
  const [clientPasswordError, setClientPasswordError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordError =
    clientPasswordError || (submitError ? getFieldError(submitError, 'senha') : null);

  function handleOpenChange(nextOpen) {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen) {
      setSubmitError(null);
      setClientPasswordError(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const senha = String(formData.get('senha') ?? '');
    const validationError = validateRequired(senha, 'A senha');

    if (validationError) {
      setClientPasswordError(validationError);
      focusFirstInvalidField(form, ['senha']);

      return;
    }

    setClientPasswordError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await authApi.delete('/auth/mfa', { json: { senha } });

      await onDisabled();
      onOpenChange(false);
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
        <Form noValidate onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Desativar verificação em duas etapas</DialogTitle>
            <DialogDescription>
              Confirme sua senha para reduzir a proteção da conta.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="disable-mfa-password">Senha</Label>
              <Input
                size="lg"

                id="disable-mfa-password"
                name="senha"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
                aria-invalid={Boolean(passwordError)}
                disabled={isSubmitting}
                onChange={() => {
                  setClientPasswordError(null);
                  setSubmitError(null);
                }}
              />
              <FieldError id={PASSWORD_ERROR_ID} message={passwordError} />
            </div>

            <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              }
            />
            <Button
              variant="destructive"
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? 'Desativando...' : 'Desativar'}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
