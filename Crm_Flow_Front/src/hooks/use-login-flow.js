import { useState } from 'react';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';

/**
 * Os valores são os mesmos que o backend devolve em `nextStep` — comparar
 * direto com a resposta é o que mantém a máquina alinhada com a API.
 */
export const LOGIN_STEP = {
  EMAIL: 'email',
  VERIFICATION_CODE: 'verificationCode',
  PASSWORD: 'password',
  MFA_CODE: 'mfaCode',
  CREATE_PASSWORD: 'createPassword',
  SUCCESS: 'success',
};

/**
 * Orquestração do login, compartilhada pelo login do tenant e pelo da área
 * master. Os dois consomem os mesmos endpoints de `/auth/*`, então duplicar a
 * máquina de passos faria os fluxos divergirem assim que o backend mudasse.
 *
 * O que fica de fora de propósito: títulos, descrições e o JSX do Card. É onde
 * as duas telas legitimamente diferem, e é o que cada página continua dona.
 *
 * @param {(resposta: unknown, options: { mfaVerified: boolean }) => Promise<unknown>}
 *   onAuthenticated recebe a resposta final (a que traz os tokens). O tenant
 *   injeta o `login` do `useAuth`; o admin, o do `useAdminAuth`. Se lançar — é
 *   o que acontece quando a conta não tem o papel exigido — o erro sobe para o
 *   `catch` de quem chamou e aparece no alerta daquele passo.
 */
export function useLoginFlow(onAuthenticated) {
  const [step, setStep] = useState(LOGIN_STEP.EMAIL);
  const [email, setEmail] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailError = submitError ? getFieldError(submitError, 'email') : null;

  async function handleLoginResponse(
    response,
    submittedEmail = email,
    { mfaVerified = false } = {},
  ) {
    const nextStep = response?.nextStep;

    if (
      nextStep === LOGIN_STEP.PASSWORD ||
      nextStep === LOGIN_STEP.MFA_CODE ||
      nextStep === LOGIN_STEP.VERIFICATION_CODE ||
      nextStep === LOGIN_STEP.CREATE_PASSWORD
    ) {
      setEmail(submittedEmail);
      setStep(nextStep);
      return;
    }

    if (nextStep) {
      throw new Error(`Etapa de autenticação desconhecida: ${nextStep}`);
    }

    await onAuthenticated(response, { mfaVerified });
    setStep(LOGIN_STEP.SUCCESS);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const submittedEmail = String(formData.get('email') ?? '').trim();

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', {
        email: submittedEmail,
      });

      await handleLoginResponse(response, submittedEmail);
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function restartLogin() {
    setStep(LOGIN_STEP.EMAIL);
    setEmail('');
    setSubmitError(null);
  }

  return {
    step,
    email,
    submitError,
    setSubmitError,
    isSubmitting,
    emailError,
    handleLoginResponse,
    handleSubmit,
    restartLogin,
  };
}
