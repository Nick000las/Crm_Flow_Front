import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFieldError, isAbortError, toApiError } from '@/services/api';

const PASSWORD_ERROR_ID = 'disable-mfa-password-error';
const SUBMIT_ERROR_ID = 'disable-mfa-submit-error';

/**
 * Desligar o MFA exige a senha de novo — reduzir a proteção não pode
 * depender só de um access token válido (regra do backend em `DELETE /auth/mfa`).
 */
export function DisableMfaDialog({ open, onOpenChange, authApi, onDisabled }) {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordError = submitError
    ? getFieldError(submitError, 'senha')
    : null;

  function handleOpenChange(nextOpen) {
    if (!nextOpen) setSubmitError(null);
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const senha = String(formData.get('senha') ?? '');

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await authApi.delete('/auth/mfa', { json: { senha } });

      await onDisabled();
      handleOpenChange(false);
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
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
                className="h-10"
                id="disable-mfa-password"
                name="senha"
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                aria-describedby={
                  passwordError ? PASSWORD_ERROR_ID : undefined
                }
                aria-invalid={Boolean(passwordError)}
                disabled={isSubmitting}
                onChange={() => setSubmitError(null)}
                required
              />
              {passwordError && (
                <p className="text-sm text-destructive" id={PASSWORD_ERROR_ID}>
                  {passwordError}
                </p>
              )}
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
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Desativando...' : 'Desativar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
