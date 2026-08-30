import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

const MFA_CODE_ERROR_ID = 'mfa-code-error';
const SUBMIT_ERROR_ID = 'mfa-code-submit-error';

/**
 * Segundo fator por e-mail. Não recebe `email`: o cookie httpOnly `mfa_token`
 * emitido por `/auth/login/password` já carrega o contexto do usuário, e o
 * cliente HTTP envia cookies por padrão (`credentials: 'include'`).
 */
export function MfaCode({ onSuccess }) {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mfaCodeError = submitError
    ? getFieldError(submitError, 'verificationCode')
    : null;

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const verificationCode = String(
      formData.get('verificationCode') ?? '',
    ).trim();

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/mfa/verify', {
        verificationCode,
      });

      // 2º argumento é `submittedEmail` — o passo de MFA não conhece o e-mail,
      // então deixa o padrão do orquestrador valer.
      await onSuccess?.(response, undefined, { mfaVerified: true });
    } catch (error) {
      if (!isAbortError(error)) {
        // O backend responde erro genérico aqui — sem contador de tentativas
        // restantes. Mostramos a mensagem dele como veio, sem inventar dado.
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
          <Label htmlFor="mfaCode">Código de verificação</Label>
          <Input
            className="h-10 font-mono tracking-[0.3em]"
            id="mfaCode"
            name="verificationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            autoFocus
            aria-describedby={mfaCodeError ? MFA_CODE_ERROR_ID : undefined}
            aria-invalid={Boolean(mfaCodeError)}
            disabled={isSubmitting}
            onChange={() => setSubmitError(null)}
            required
          />
          {mfaCodeError && (
            <p className="text-sm text-destructive" id={MFA_CODE_ERROR_ID}>
              {mfaCodeError}
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
          {isSubmitting ? 'Verificando...' : 'Verificar'}
        </Button>
      </form>
    </CardContent>
  );
}
