import { Form } from '@/components/ui/form';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  focusFirstInvalidField,
  validateMinLength,
  validatePasswordMatch,
} from '@/lib/form-validation';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const PASSWORD_ERROR_ID = 'create-password-error';
const PASSWORD_CONFIRMATION_ERROR_ID = 'password-confirmation-error';
const SUBMIT_ERROR_ID = 'create-password-submit-error';
const MIN_PASSWORD_LENGTH = 8;

export function CreatePassword({ onSuccess, sessionScope = 'tenant' }) {
  const [submitError, setSubmitError] = useState(null);
  const [clientPasswordError, setClientPasswordError] = useState(null);
  const [confirmationError, setConfirmationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordError =
    clientPasswordError || (submitError ? getFieldError(submitError, 'senha') : null);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');

    const nextPasswordError = validateMinLength(password, MIN_PASSWORD_LENGTH, 'A nova senha');
    const nextConfirmationError = validatePasswordMatch(password, passwordConfirmation);

    setSubmitError(null);
    setClientPasswordError(nextPasswordError);
    setConfirmationError(nextConfirmationError);

    if (nextPasswordError || nextConfirmationError) {
      focusFirstInvalidField(form, [
        ...(nextPasswordError ? ['password'] : []),
        ...(nextConfirmationError ? ['passwordConfirmation'] : []),
      ]);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/activation/password', {
        senha: password,
        scope: sessionScope,
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
    setClientPasswordError(null);
    setConfirmationError(null);
  }

  return (
    <Form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="h-10.5 pr-10 pl-9.5"
            id="new-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Crie uma senha forte"
            autoComplete="new-password"
            autoFocus
            aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
            aria-invalid={Boolean(passwordError)}
            disabled={isSubmitting}
            onChange={clearErrors}
          />
          <Button
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
            aria-pressed={showPassword}
            disabled={isSubmitting}
            onClick={() => setShowPassword((isVisible) => !isVisible)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
        <FieldError id={PASSWORD_ERROR_ID} message={passwordError} />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password-confirmation">Confirme a nova senha</Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="h-10.5 pl-9.5"
            id="password-confirmation"
            name="passwordConfirmation"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite a senha novamente"
            autoComplete="new-password"
            aria-describedby={confirmationError ? PASSWORD_CONFIRMATION_ERROR_ID : undefined}
            aria-invalid={Boolean(confirmationError)}
            disabled={isSubmitting}
            onChange={clearErrors}
          />
        </div>
        <FieldError id={PASSWORD_CONFIRMATION_ERROR_ID} message={confirmationError} />
      </div>

      <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

      <Button
        className="h-10.5 w-full"
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="Salvando…"
      >
        Criar senha
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </Form>
  );
}
