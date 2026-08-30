import { Form } from '@/components/ui/form';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  focusFirstInvalidField,
  validateEmail,
  validateExactDigits,
  validateMinLength,
  validatePasswordMatch,
} from '@/lib/form-validation';
import api, { isAbortError, toApiError } from '@/services/api';

const RESEND_SECONDS = 60;
const MIN_PASSWORD_LENGTH = 8;

export function PasswordRecovery({
  email: initialEmail = '',
  onReturn,
  onSuccess,
  sessionScope = 'tenant',
}) {
  const [email, setEmail] = useState(initialEmail);
  const [codeSent, setCodeSent] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) {
      return undefined;
    }
    const timeout = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldown]);

  function clearFieldError(field) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
    setError(null);
  }

  async function sendCode(formElement) {
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError });
      focusFirstInvalidField(formElement, ['email']);
      return;
    }

    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/auth/password/forgot', { email: email.trim() });
      setCodeSent(true);
      setCooldown(RESEND_SECONDS);
    } catch (requestError) {
      if (!isAbortError(requestError)) {
        setError(toApiError(requestError));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    const form = event.currentTarget;
    if (!codeSent) {
      await sendCode(form);
      return;
    }

    const formData = new FormData(form);
    const verificationCode = String(formData.get('verificationCode') ?? '').trim();
    const senha = String(formData.get('password') ?? '');
    const passwordConfirmation = String(formData.get('passwordConfirmation') ?? '');

    const nextErrors = {};
    const codeError = validateExactDigits(verificationCode, 6, 'O código de recuperação');
    const passwordError = validateMinLength(senha, MIN_PASSWORD_LENGTH, 'A nova senha');
    const confirmationError = validatePasswordMatch(senha, passwordConfirmation);

    if (codeError) {
      nextErrors.verificationCode = codeError;
    }
    if (passwordError) {
      nextErrors.password = passwordError;
    }
    if (confirmationError) {
      nextErrors.passwordConfirmation = confirmationError;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      focusFirstInvalidField(form, Object.keys(nextErrors));
      return;
    }

    setFieldErrors({});
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/auth/password/reset', {
        email: email.trim(),
        verificationCode,
        senha,
      });
      setCompleted(true);
      const response = await api.post('/auth/login/password', {
        email: email.trim(),
        senha,
        scope: sessionScope,
      });
      await onSuccess(response, email.trim());
    } catch (requestError) {
      if (!isAbortError(requestError)) {
        setError(toApiError(requestError));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="grid gap-5">
        <div
          className="surface-subtle grid justify-items-center gap-3 px-6 py-8 text-center"
          role="status"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">Senha redefinida com sucesso.</p>
          <p className="text-xs text-muted-foreground">
            {isSubmitting
              ? 'Entrando na sua conta…'
              : 'Você já pode acessar o Flow CRM com a sua nova senha.'}
          </p>
        </div>
        <ApiErrorAlert
          error={error}
          title="Senha salva, mas não foi possível entrar automaticamente"
        />
        <Button
          type="button"
          className="h-10.5 w-full"
          onClick={onReturn}
          disabled={isSubmitting}
          loading={isSubmitting}
          loadingText="Entrando…"
        >
          Voltar ao login
        </Button>
      </div>
    );
  }

  return (
    <Form className="grid gap-5" noValidate onSubmit={handleSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="recovery-email">E-mail da conta</Label>
        <div className="relative">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            className="h-10.5 pl-9.5"
            id="recovery-email"
            name="email"
            type="email"
            placeholder="nome@empresa.com"
            autoComplete="email"
            autoFocus={!codeSent}
            value={email}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'recovery-email-error' : undefined}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError('email');
            }}
            readOnly={codeSent}
            disabled={isSubmitting}
          />
        </div>
        <FieldError id="recovery-email-error" message={fieldErrors.email} />
      </div>

      {codeSent && (
        <>
          <p
            className="rounded-lg border border-border bg-surface/80 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground"
            role="status"
          >
            Se houver uma conta ativa com este e-mail, você receberá um código. Confira também o
            spam. O código expira em 10 minutos.
          </p>

          <div className="grid gap-2">
            <Label htmlFor="recovery-code">Código de recuperação</Label>
            <Input
              className="h-11 text-center font-mono text-base tracking-[0.4em] tabular-nums"
              id="recovery-code"
              name="verificationCode"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              autoFocus
              aria-invalid={Boolean(fieldErrors.verificationCode)}
              aria-describedby={fieldErrors.verificationCode ? 'recovery-code-error' : undefined}
              onChange={() => clearFieldError('verificationCode')}
              disabled={isSubmitting}
            />
            <FieldError id="recovery-code-error" message={fieldErrors.verificationCode} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recovery-password">Nova senha</Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-10.5 pr-10 pl-9.5"
                id="recovery-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo de 8 caracteres"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'recovery-password-error' : undefined}
                onChange={() => clearFieldError('password')}
                disabled={isSubmitting}
              />
              <Button
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={showPassword ? 'Ocultar senhas' : 'Mostrar senhas'}
                aria-pressed={showPassword}
                disabled={isSubmitting}
                onClick={() => setShowPassword((visible) => !visible)}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use pelo menos 8 caracteres.</p>
            <FieldError id="recovery-password-error" message={fieldErrors.password} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="recovery-confirmation">Confirme a nova senha</Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-10.5 pl-9.5"
                id="recovery-confirmation"
                name="passwordConfirmation"
                type={showPassword ? 'text' : 'password'}
                placeholder="Repita a nova senha"
                autoComplete="new-password"
                aria-invalid={Boolean(fieldErrors.passwordConfirmation)}
                aria-describedby={
                  fieldErrors.passwordConfirmation ? 'recovery-confirmation-error' : undefined
                }
                onChange={() => clearFieldError('passwordConfirmation')}
                disabled={isSubmitting}
              />
            </div>
            <FieldError
              id="recovery-confirmation-error"
              message={fieldErrors.passwordConfirmation}
            />
          </div>
        </>
      )}

      <ApiErrorAlert error={error} />

      <Button
        type="submit"
        loading={isSubmitting}
        loadingText={codeSent ? 'Redefinindo…' : 'Enviando código…'}
        disabled={isSubmitting}
        className="h-10.5 w-full"
      >
        {codeSent ? 'Redefinir senha' : 'Enviar código de recuperação'}
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" disabled={isSubmitting} onClick={onReturn}>
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Voltar ao login
        </Button>

        {codeSent && (
          <Button
            type="button"
            variant="link"
            size="sm"
            disabled={isSubmitting || cooldown > 0}
            onClick={() => sendCode(null)}
          >
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar código'}
          </Button>
        )}
      </div>
    </Form>
  );
}
