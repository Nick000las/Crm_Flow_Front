/**
 * @file Organiza a tela de admin login page, na área de administração, e coordena navegação,
 * consultas e ações do usuário.
 */
import {
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  MailCheck,
  ShieldCheck,
} from 'lucide-react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { FieldError } from '@/components/field-error';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { LOGIN_STEP, useLoginFlow } from '@/hooks/use-login-flow';
import { AuthShell } from '@/modules/auth/components/auth-shell';
import { CreatePassword } from '@/modules/auth/pages/create-password';
import { MfaCode } from '@/modules/auth/pages/mfa-code';
import { Password } from '@/modules/auth/pages/password';
import { PasswordRecovery } from '@/modules/auth/pages/password-recovery';
import { VerificationCode } from '@/modules/auth/pages/verification-code';

const EMAIL_ERROR_ID = 'admin-email-error';
const SUBMIT_ERROR_ID = 'admin-login-submit-error';
const STEP_CONTENT = {
  [LOGIN_STEP.RECOVERY]: {
    icon: KeyRound,
    title: 'Recupere sua conta',
    description: 'Receba um código por e-mail para redefinir sua senha.',
  },
  [LOGIN_STEP.EMAIL]: {
    icon: ShieldCheck,
    title: 'Acesso administrativo',
    description: 'Área master da plataforma, isolada do acesso dos tenants.',
  },
  [LOGIN_STEP.PASSWORD]: {
    icon: Lock,
    title: 'Digite sua senha',
    description: 'Use a senha vinculada à sua conta master.',
  },
  [LOGIN_STEP.MFA_CODE]: {
    icon: ShieldCheck,
    title: 'Confirme sua identidade',
    description: 'Informe o código de 6 dígitos enviado para seu e-mail.',
  },
  [LOGIN_STEP.VERIFICATION_CODE]: {
    icon: MailCheck,
    title: 'Verifique seu e-mail',
    description: 'Informe o código enviado para sua caixa de entrada.',
  },
  [LOGIN_STEP.CREATE_PASSWORD]: {
    icon: KeyRound,
    title: 'Crie sua senha',
    description: 'Defina uma senha segura para a conta master.',
  },
  [LOGIN_STEP.SUCCESS]: {
    icon: CheckCircle2,
    title: 'Acesso confirmado',
    description: 'Abrindo a área administrativa.',
  },
};

export default function AdminLoginPage() {
  const { login } = useAdminAuth();
  const {
    step,
    email,
    setEmail,
    submitError,
    setSubmitError,
    isSubmitting,
    emailError,
    handleLoginResponse,
    handleSubmit,
    restartLogin,
    startRecovery,
  } = useLoginFlow(login);
  const content = STEP_CONTENT[step];
  const showEmailContext =
    step === LOGIN_STEP.PASSWORD ||
    step === LOGIN_STEP.VERIFICATION_CODE ||
    step === LOGIN_STEP.CREATE_PASSWORD ||
    step === LOGIN_STEP.MFA_CODE;

  const footer =
    step !== LOGIN_STEP.EMAIL && step !== LOGIN_STEP.SUCCESS && step !== LOGIN_STEP.RECOVERY ? (
      <div className="flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={restartLogin}>
          Usar outro e-mail
        </Button>
      </div>
    ) : null;

  return (
    <AuthShell
      variant="admin"
      stepKey={step}
      stepIcon={content.icon}
      title={content.title}
      description={content.description}
      email={email}
      showEmailContext={showEmailContext}
      onChangeEmail={restartLogin}
      footer={footer}
    >
      {step === LOGIN_STEP.EMAIL && (
        <Form className="grid gap-5" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="admin-email">E-mail</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                size="lg"
                className="pl-9.5"
                id="admin-email"
                name="email"
                type="email"
                placeholder="admin@crmflow.com"
                autoComplete="email"
                autoFocus
                aria-describedby={emailError ? EMAIL_ERROR_ID : undefined}
                aria-invalid={Boolean(emailError)}
                disabled={isSubmitting}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSubmitError(null);
                }}
              />
            </div>
            <FieldError id={EMAIL_ERROR_ID} message={emailError} />
          </div>

          <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

          <Button
            size="lg"
            className="w-full"
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            loadingText="Continuando…"
          >
            Continuar
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>

          <div className="flex justify-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              disabled={isSubmitting}
              onClick={startRecovery}
            >
              Esqueceu sua senha?
            </Button>
          </div>
        </Form>
      )}

      {step === LOGIN_STEP.PASSWORD && (
        <Password
          sessionScope="admin"
          email={email}
          onSuccess={handleLoginResponse}
          onForgotPassword={startRecovery}
        />
      )}

      {step === LOGIN_STEP.RECOVERY && (
        <PasswordRecovery
          email={email}
          onReturn={restartLogin}
          onSuccess={handleLoginResponse}
          sessionScope="admin"
        />
      )}

      {step === LOGIN_STEP.MFA_CODE && (
        <MfaCode sessionScope="admin" onSuccess={handleLoginResponse} />
      )}

      {step === LOGIN_STEP.VERIFICATION_CODE && (
        <VerificationCode email={email} onSuccess={handleLoginResponse} />
      )}

      {step === LOGIN_STEP.CREATE_PASSWORD && (
        <CreatePassword sessionScope="admin" onSuccess={handleLoginResponse} />
      )}

      {step === LOGIN_STEP.SUCCESS && (
        <div className="surface-subtle grid justify-items-center gap-3 px-6 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">Acesso administrativo confirmado.</p>
          <p className="text-xs text-muted-foreground">Carregando console master…</p>
        </div>
      )}
    </AuthShell>
  );
}
