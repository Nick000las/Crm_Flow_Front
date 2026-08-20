import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const PASSWORD_ERROR_ID = 'password-error';
const SUBMIT_ERROR_ID = 'password-submit-error';

export function Password({ email, onSuccess }) {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordError = submitError
    ? getFieldError(submitError, 'senha')
    : null;

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login/password', {
        email,
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

  return (
    <CardContent className="px-6 py-8 sm:px-8">
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="password">Senha</Label>
          <div className="relative">
            <Input
              className="h-10 pr-10"
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              aria-describedby={passwordError ? PASSWORD_ERROR_ID : undefined}
              aria-invalid={Boolean(passwordError)}
              disabled={isSubmitting}
              onChange={() => setSubmitError(null)}
              required
            />
            <Button
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              type="button"
              variant="ghost"
              size="icon"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
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

        <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

        <Button
          className="h-10 w-full"
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>
    </CardContent>
  );
}
