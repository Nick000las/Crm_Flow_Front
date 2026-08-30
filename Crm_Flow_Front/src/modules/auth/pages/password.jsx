import { Form } from '@/components/ui/form';
import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { focusFirstInvalidField, validateRequired } from '@/lib/form-validation';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const PASSWORD_ERROR_ID = 'password-error';
const SUBMIT_ERROR_ID = 'password-submit-error';

export function Password({ email, onSuccess, onForgotPassword, sessionScope = 'tenant' }) {
  const [submitError, setSubmitError] = useState(null);
  const [clientPasswordError, setClientPasswordError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordError =
    clientPasswordError || (submitError ? getFieldError(submitError, 'senha') : null);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    const validationError = validateRequired(password, 'A senha');

    if (validationError) {
      setClientPasswordError(validationError);
      focusFirstInvalidField(form, ['password']);
      return;
    }

    setClientPasswordError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login/password', {
        email,
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

  return (
    <Form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">Senha</Label>
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto p-0 text-xs"
            disabled={isSubmitting}
            onClick={onForgotPassword}
          >
            Esqueceu sua senha?
          </Button>
        </div>

        <div className="relative">
          <Lock
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="h-10.5 pr-10 pl-9.5"
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Digite sua senha"
            autoComplete="current-password"
            autoFocus
            aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
            aria-invalid={Boolean(passwordError)}
            disabled={isSubmitting}
            onChange={() => {
              setClientPasswordError(null);
              setSubmitError(null);
            }}
          />
          <Button
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={showPassword}
            disabled={isSubmitting}
            onClick={() => setShowPassword((isVisible) => !isVisible)}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
        <FieldError id={PASSWORD_ERROR_ID} message={passwordError} />
      </div>

      <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

      <Button
        className="h-10.5 w-full"
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="Entrando…"
      >
        Entrar
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </Form>
  );
}
