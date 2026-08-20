import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const VERIFICATION_CODE_ERROR_ID = 'verification-code-error';
const SUBMIT_ERROR_ID = 'verification-code-submit-error';

export function VerificationCode({ email, onSuccess }) {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const verificationCodeError = submitError
    ? getFieldError(submitError, 'verificationCode')
    : null;

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const verificationCode = String(
      formData.get('verificationCode') ?? ''
    ).trim();

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
    <CardContent className="px-6 py-8 sm:px-8">
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="verificationCode">Código de verificação</Label>
          <Input
            className="h-10"
            id="verificationCode"
            name="verificationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            placeholder="Digite o código enviado para seu e-mail"
            aria-describedby={
              verificationCodeError ? VERIFICATION_CODE_ERROR_ID : undefined
            }
            aria-invalid={Boolean(verificationCodeError)}
            disabled={isSubmitting}
            onChange={() => setSubmitError(null)}
            required
          />
          {verificationCodeError && (
            <p
              className="text-sm text-destructive"
              id={VERIFICATION_CODE_ERROR_ID}
            >
              {verificationCodeError}
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
          {isSubmitting ? 'Enviando...' : 'Enviar'}
        </Button>
      </form>
    </CardContent>
  );
}
