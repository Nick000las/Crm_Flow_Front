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
import { LOGIN_STEP, useLoginFlow } from '@/hooks/use-login-flow';
import { CreatePassword } from './create-password';
import { MfaCode } from './mfa-code';
import { Password } from './password';
import { VerificationCode } from './verification-code';

const EMAIL_ERROR_ID = 'email-error';
const SUBMIT_ERROR_ID = 'login-submit-error';
const STEP_CONTENT = {
  [LOGIN_STEP.EMAIL]: {
    title: 'Bem-vindo de volta',
    description: 'Informe seu e-mail para continuar.',
  },
  [LOGIN_STEP.PASSWORD]: {
    title: 'Digite sua senha',
    description: 'Use a senha vinculada à sua conta.',
  },
  [LOGIN_STEP.MFA_CODE]: {
    title: 'Confirme sua identidade',
    description: 'Informe o código de 6 dígitos enviado para seu e-mail.',
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
  const {
    step,
    email,
    submitError,
    setSubmitError,
    isSubmitting,
    emailError,
    handleLoginResponse,
    handleSubmit,
    restartLogin,
  } = useLoginFlow(login);
  const content = STEP_CONTENT[step];

  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 px-4 py-10">
      <Card className="relative w-full max-w-md gap-0 py-0">
        <CardHeader className="gap-0 px-6 pb-0 pt-8 sm:px-8">
          <div className="mb-8 flex items-center gap-2.5 font-semibold" aria-label="Flow CRM">
            <span
              className="grid size-9 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground"
              aria-hidden="true"
            >
              F
            </span>
            <span>Flow CRM</span>
          </div>

          <CardTitle id="login-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {content.title}
          </CardTitle>
          <CardDescription className="mt-2 leading-relaxed">{content.description}</CardDescription>
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
                loading={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Continuar'}
              </Button>
            </form>
          </CardContent>
        )}

        {step === LOGIN_STEP.PASSWORD && <Password email={email} onSuccess={handleLoginResponse} />}

        {step === LOGIN_STEP.MFA_CODE && <MfaCode onSuccess={handleLoginResponse} />}

        {step === LOGIN_STEP.VERIFICATION_CODE && (
          <VerificationCode email={email} onSuccess={handleLoginResponse} />
        )}

        {step === LOGIN_STEP.CREATE_PASSWORD && <CreatePassword onSuccess={handleLoginResponse} />}

        {step === LOGIN_STEP.SUCCESS && (
          <CardContent className="px-6 py-10 sm:px-8">
            <div className="grid justify-items-center gap-3 text-center">
              <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
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
