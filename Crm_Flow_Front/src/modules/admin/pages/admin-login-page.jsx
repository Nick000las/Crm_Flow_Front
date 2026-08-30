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
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LOGIN_STEP, useLoginFlow } from '@/hooks/use-login-flow';
// Os passos são os mesmos do login do tenant: autocontidos, falam com o `api`
// não autenticado e renderizam só o próprio `CardContent`. O backend usa as
// mesmas rotas de `/auth/*` para as duas áreas, então reaproveitá-los é o que
// mantém os dois fluxos sincronizados.
import { CreatePassword } from '@/modules/auth/pages/create-password';
import { MfaCode } from '@/modules/auth/pages/mfa-code';
import { Password } from '@/modules/auth/pages/password';
import { VerificationCode } from '@/modules/auth/pages/verification-code';

const EMAIL_ERROR_ID = 'admin-email-error';
const SUBMIT_ERROR_ID = 'admin-login-submit-error';
const STEP_CONTENT = {
  [LOGIN_STEP.EMAIL]: {
    title: 'Acesso administrativo',
    description: 'Área master da plataforma, isolada do acesso dos tenants.',
  },
  [LOGIN_STEP.PASSWORD]: {
    title: 'Digite sua senha',
    description: 'Use a senha vinculada à sua conta master.',
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
    description: 'Defina uma senha segura para a conta master.',
  },
  [LOGIN_STEP.SUCCESS]: {
    title: 'Acesso confirmado',
    description: 'Abrindo a área administrativa.',
  },
};

/**
 * Login da área master. Mesmos endpoints do login do tenant — o que distingue
 * a sessão é o papel, conferido dentro do `login` do `useAdminAuth` antes de a
 * sessão passar a existir. Uma conta sem `MASTER` recebe o erro no passo em
 * que está e não entra.
 */
export default function AdminLoginPage() {
  const { login } = useAdminAuth();
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
      <Card className="w-full max-w-md gap-0 py-0">
        <CardHeader className="gap-0 px-6 pb-0 pt-8 sm:px-8">
          <div
            className="mb-8 flex items-center gap-2.5 font-semibold"
            aria-label="Flow CRM — Administração"
          >
            <span
              className="grid size-9 place-items-center rounded-md bg-foreground text-sm font-bold text-background"
              aria-hidden="true"
            >
              F
            </span>
            <span>
              Flow CRM
              <span className="ml-2 font-mono text-xs font-normal tracking-wide text-muted-foreground uppercase">
                master
              </span>
            </span>
          </div>

          <CardTitle className="text-2xl font-semibold tracking-tight sm:text-3xl">
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
                <Label htmlFor="admin-email">E-mail</Label>
                <Input
                  className="h-10"
                  id="admin-email"
                  name="email"
                  type="email"
                  placeholder="admin@crmflow.com"
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

        {step === LOGIN_STEP.MFA_CODE && (
          <MfaCode onSuccess={handleLoginResponse} />
        )}

        {step === LOGIN_STEP.VERIFICATION_CODE && (
          <VerificationCode email={email} onSuccess={handleLoginResponse} />
        )}

        {step === LOGIN_STEP.CREATE_PASSWORD && (
          <CreatePassword onSuccess={handleLoginResponse} />
        )}

        {step === LOGIN_STEP.SUCCESS && (
          <CardContent className="px-6 py-10 sm:px-8">
            <div className="grid justify-items-center gap-3 text-center">
              <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
              <p className="font-medium">Acesso administrativo confirmado.</p>
            </div>
          </CardContent>
        )}

        {step !== LOGIN_STEP.EMAIL && step !== LOGIN_STEP.SUCCESS && (
          <CardFooter className="justify-center px-6 py-4 sm:px-8">
            <Button type="button" variant="link" onClick={restartLogin}>
              Usar outro e-mail
            </Button>
          </CardFooter>
        )}
      </Card>
    </main>
  );
}
