import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import api, { getFieldError, isAbortError, toApiError } from '@/services/api';
import { CreatePassword } from './create-password';
import { Password } from './password';
import { VerificationCode } from './verification-code';

const EMAIL_ERROR_ID = 'email-error';
const SUBMIT_ERROR_ID = 'login-submit-error';
const LOGIN_STEP = {
  EMAIL: 'email',
  VERIFICATION_CODE: 'verificationCode',
  PASSWORD: 'password',
  CREATE_PASSWORD: 'createPassword',
  SUCCESS: 'success',
};
const STEP_CONTENT = {
  [LOGIN_STEP.EMAIL]: {
    title: 'Bem-vindo de volta',
    description: 'Informe seu e-mail para continuar.',
  },
  [LOGIN_STEP.PASSWORD]: {
    title: 'Digite sua senha',
    description: 'Use a senha vinculada à sua conta.',
  },
  [LOGIN_STEP.VERIFICATION_CODE]: {
    title: 'Verifique seu e-mail',
    description: 'Informe o código enviado para sua caixa de entrada.',
  },
  [LOGIN_STEP.CREATE_PASSWORD]: {
    title: 'Crie sua senha',
    description: 'Defina uma senha segura para acessar o Flow CRM.',
  },
  [LOGIN_STEP.SUCCESS]: {
    title: 'Acesso confirmado',
    description: 'Sua autenticação foi concluída com sucesso.',
  },
};

export default function EmailLogin() {
  const { login } = useAuth();
  const [step, setStep] = useState(LOGIN_STEP.EMAIL);
  const [email, setEmail] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailError = submitError ? getFieldError(submitError, 'email') : null;
  const content = STEP_CONTENT[step];

  async function handleLoginResponse(response, submittedEmail = email) {
    const nextStep = response?.nextStep;

    if (
      nextStep === LOGIN_STEP.PASSWORD ||
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

    await login(response);
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

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-muted/40 px-4 py-10">
      <div
        className="absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-28 -right-20 size-80 rounded-full bg-primary/10 blur-3xl"
        aria-hidden="true"
      />

      <Card className="relative w-full max-w-md gap-0 py-0 shadow-xl shadow-black/5">
        <CardHeader className="gap-0 px-6 pb-0 pt-8 sm:px-8">
          <div
            className="mb-8 flex items-center gap-2.5 font-semibold"
            aria-label="Flow CRM"
          >
            <span
              className="grid size-9 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm"
              aria-hidden="true"
            >
              F
            </span>
            <span>Flow CRM</span>
          </div>

          <CardTitle
            id="login-title"
            className="text-2xl font-semibold tracking-tight sm:text-3xl"
          >
            {content.title}
          </CardTitle>
          <CardDescription className="mt-2 leading-relaxed">
            {content.description}
          </CardDescription>
        </CardHeader>

        {step === LOGIN_STEP.EMAIL && (
          <CardContent className="px-6 py-8 sm:px-8">
            <form className="grid gap-6" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  className="h-10"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  autoComplete="email"
                  aria-describedby={emailError ? EMAIL_ERROR_ID : undefined}
                  aria-invalid={Boolean(emailError)}
                  disabled={isSubmitting}
                  onChange={() => setSubmitError(null)}
                  required
                />
                {emailError && (
                  <p className="text-sm text-destructive" id={EMAIL_ERROR_ID}>
                    {emailError}
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
                {isSubmitting ? 'Enviando...' : 'Continuar'}
              </Button>
            </form>
          </CardContent>
        )}

        {step === LOGIN_STEP.PASSWORD && (
          <Password email={email} onSuccess={handleLoginResponse} />
        )}

        {step === LOGIN_STEP.VERIFICATION_CODE && (
          <VerificationCode
            email={email}
            onSuccess={handleLoginResponse}
          />
        )}

        {step === LOGIN_STEP.CREATE_PASSWORD && (
          <CreatePassword onSuccess={handleLoginResponse} />
        )}

        {step === LOGIN_STEP.SUCCESS && (
          <CardContent className="px-6 py-10 sm:px-8">
            <div className="grid justify-items-center gap-3 text-center">
              <CheckCircle2
                className="size-12 text-primary"
                aria-hidden="true"
              />
              <p className="font-medium">Login realizado com sucesso.</p>
            </div>
          </CardContent>
        )}

        {step === LOGIN_STEP.EMAIL ? (
          <CardFooter className="justify-center px-6 py-4 text-center text-sm text-muted-foreground sm:px-8">
            <span>Ainda não tem uma conta?</span>
            <Button className="h-auto px-1.5 py-0" type="button" variant="link">
              Fale com o administrador
            </Button>
          </CardFooter>
        ) : step !== LOGIN_STEP.SUCCESS ? (
          <CardFooter className="justify-center px-6 py-4 sm:px-8">
            <Button type="button" variant="link" onClick={restartLogin}>
              Usar outro e-mail
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </main>
  );
}
