import { Form } from '@/components/ui/form';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { focusFirstInvalidField, validateExactDigits } from '@/lib/form-validation';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const MFA_CODE_ERROR_ID = 'mfa-code-error';
const SUBMIT_ERROR_ID = 'mfa-code-submit-error';

/**
 * Segundo fator por e-mail. Não recebe `email`: o cookie httpOnly `mfa_token`
 * emitido por `/auth/login/password` já carrega o contexto do usuário, e o
 * cliente HTTP envia cookies por padrão (`credentials: 'include'`).
 */
export function MfaCode({ onSuccess, sessionScope = 'tenant' }) {
  const [submitError, setSubmitError] = useState(null);
  const [clientCodeError, setClientCodeError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mfaCodeError =
    clientCodeError || (submitError ? getFieldError(submitError, 'verificationCode') : null);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const verificationCode = String(formData.get('verificationCode') ?? '').trim();
    const validationError = validateExactDigits(verificationCode, 6, 'O código de verificação');

    if (validationError) {
      setClientCodeError(validationError);
      focusFirstInvalidField(form, ['verificationCode']);
      return;
    }

    setClientCodeError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/mfa/verify', {
        verificationCode,
        scope: sessionScope,
      });

      await onSuccess?.(response, undefined, { mfaVerified: true });
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
        <Label htmlFor="mfaCode">Código de verificação</Label>
        <Input
          className="h-12 text-center font-mono text-lg tracking-[0.45em] tabular-nums"
          id="mfaCode"
          name="verificationCode"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          autoFocus
          aria-describedby={mfaCodeError ? MFA_CODE_ERROR_ID : undefined}
          aria-invalid={Boolean(mfaCodeError)}
          disabled={isSubmitting}
          onChange={() => {
            setClientCodeError(null);
            setSubmitError(null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Digite os 6 dígitos enviados para o seu e-mail.
        </p>
        <FieldError id={MFA_CODE_ERROR_ID} message={mfaCodeError} />
      </div>

      <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

      <Button
        className="h-10.5 w-full"
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="Verificando…"
      >
        Verificar código
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </Form>
  );
}
