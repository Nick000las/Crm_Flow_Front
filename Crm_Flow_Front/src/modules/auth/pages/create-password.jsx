import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const PASSWORD_ERROR_ID = 'create-password-error';
const PASSWORD_CONFIRMATION_ERROR_ID = 'password-confirmation-error';
const SUBMIT_ERROR_ID = 'create-password-submit-error';

export function CreatePassword({ onSuccess }) {
  const [submitError, setSubmitError] = useState(null);
  const [confirmationError, setConfirmationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordError = submitError
    ? getFieldError(submitError, 'senha')
    : null;

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const passwordConfirmation = String(
      formData.get('passwordConfirmation') ?? '',
    );

    setSubmitError(null);
    setConfirmationError(null);

    if (password !== passwordConfirmation) {
      setConfirmationError('As senhas não coincidem.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/activation/password', {
        senha: password,
      });

      await onSuccess?.(response);
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearErrors() {
    setSubmitError(null);
    setConfirmationError(null);
  }

  return (
    <CardContent className="px-6 py-8 sm:px-8">
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="new-password">Nova senha</Label>
          <div className="relative">
            <Input
              className="h-10 pr-10"
              id="new-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Crie uma senha"
              autoComplete="new-password"
              aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
              aria-invalid={Boolean(passwordError)}
              disabled={isSubmitting}
              onChange={clearErrors}
              required
            />
            <Button
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
              variant="ghost"
              size="icon"
              aria-label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
              aria-pressed={showPassword}
              disabled={isSubmitting}
              onClick={() => setShowPassword((isVisible) => !isVisible)}
            >
              {showPassword ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          {passwordError && (
            <p className="text-sm text-destructive" id={PASSWORD_ERROR_ID}>
              {passwordError}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password-confirmation">Confirme a nova senha</Label>
          <Input
            className="h-10"
            id="password-confirmation"
            name="passwordConfirmation"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            aria-describedby={
              confirmationError ? PASSWORD_CONFIRMATION_ERROR_ID : undefined
            }
            aria-invalid={Boolean(confirmationError)}
            disabled={isSubmitting}
            onChange={clearErrors}
            required
          />
          {confirmationError && (
            <p
              className="text-sm text-destructive"
              id={PASSWORD_CONFIRMATION_ERROR_ID}
            >
              {confirmationError}
            </p>
          )}
        </div>

        <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

        <Button
          className="h-10 w-full"
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Criar senha'}
        </Button>
      </form>
    </CardContent>
  );
}
