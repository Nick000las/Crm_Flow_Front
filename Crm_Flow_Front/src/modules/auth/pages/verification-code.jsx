/**
 * @file Organiza a tela de verification code, na área de autenticação, e coordena navegação,
 * consultas e ações do usuário.
 */
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { focusFirstInvalidField, validateRequired } from '@/lib/form-validation';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const VERIFICATION_CODE_ERROR_ID = 'verification-code-error';
const SUBMIT_ERROR_ID = 'verification-code-submit-error';

export function VerificationCode({ email, onSuccess }) {
  const [submitError, setSubmitError] = useState(null);
  const [clientCodeError, setClientCodeError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const verificationCodeError =
    clientCodeError || (submitError ? getFieldError(submitError, 'verificationCode') : null);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const verificationCode = String(formData.get('verificationCode') ?? '').trim();
    const requiredError = validateRequired(verificationCode, 'O código de verificação');

    if (requiredError) {
      setClientCodeError(requiredError);
      focusFirstInvalidField(form, ['verificationCode']);

      return;
    }

    if (!/^\d+$/.test(verificationCode)) {
      setClientCodeError('O código de verificação deve conter apenas números.');
      focusFirstInvalidField(form, ['verificationCode']);

      return;
    }

    setClientCodeError(null);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/activation/verify', {
        email,
        verificationCode,
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
        <Label htmlFor="verificationCode">Código de verificação</Label>
        <Input
          className="h-12 text-center font-mono text-lg tracking-[0.4em] tabular-nums"
          id="verificationCode"
          name="verificationCode"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          autoFocus
          aria-describedby={verificationCodeError ? VERIFICATION_CODE_ERROR_ID : undefined}
          aria-invalid={Boolean(verificationCodeError)}
          disabled={isSubmitting}
          onChange={() => {
            setClientCodeError(null);
            setSubmitError(null);
          }}
        />
        <p className="text-xs text-muted-foreground">
          Confira sua caixa de entrada e a pasta de spam.
        </p>
        <FieldError id={VERIFICATION_CODE_ERROR_ID} message={verificationCodeError} />
      </div>

      <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

      <Button
        size="lg"
        className="w-full"
        type="submit"
        disabled={isSubmitting}
        loading={isSubmitting}
        loadingText="Verificando…"
      >
        Continuar
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </Form>
  );
}
