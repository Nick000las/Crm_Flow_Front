import { Form } from '@/components/ui/form';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { LOGIN_STEP, useLoginFlow } from '@/hooks/use-login-flow';
import { AuthShell } from '../components/auth-shell';
import { CreatePassword } from './create-password';
import { MfaCode } from './mfa-code';
import { Password } from './password';
import { PasswordRecovery } from './password-recovery';
import { VerificationCode } from './verification-code';

const EMAIL_ERROR_ID = 'email-error';
const SUBMIT_ERROR_ID = 'login-submit-error';
const STEP_CONTENT = {
  [LOGIN_STEP.RECOVERY]: {
    icon: KeyRound,
    title: 'Recupere sua conta',
    description: 'Receba um código por e-mail para redefinir sua senha com segurança.',
  },
  [LOGIN_STEP.EMAIL]: {
    icon: Mail,
    title: 'Bem-vindo de volta',
    description: 'Informe seu e-mail corporativo para acessar sua conta.',
  },
  [LOGIN_STEP.PASSWORD]: {
    icon: Lock,
    title: 'Digite sua senha',
    description: 'Use a senha vinculada à sua conta para continuar.',
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
    description: 'Defina uma senha forte para acessar o Flow CRM.',
  },
  [LOGIN_STEP.SUCCESS]: {
    icon: CheckCircle2,
    title: 'Acesso confirmado',
    description: 'Sua autenticação foi concluída com sucesso.',
  },
};

export default function EmailLogin() {
  const { login } = useAuth();
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
    step === LOGIN_STEP.EMAIL ? (
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem uma conta?{' '}
        <span className="font-medium text-foreground">Fale com o administrador da empresa.</span>
      </p>
    ) : step !== LOGIN_STEP.SUCCESS && step !== LOGIN_STEP.RECOVERY ? (
      <div className="flex justify-center">
        <Button type="button" variant="ghost" size="sm" onClick={restartLogin}>
          Usar outro e-mail
        </Button>
      </div>
    ) : null;

  return (
    <AuthShell
      variant="tenant"
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
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                className="h-10.5 pl-9.5"
                id="email"
                name="email"
                type="email"
                placeholder="nome@empresa.com"
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
            className="h-10.5 w-full"
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
        <Password email={email} onSuccess={handleLoginResponse} onForgotPassword={startRecovery} />
      )}

      {step === LOGIN_STEP.RECOVERY && (
        <PasswordRecovery email={email} onReturn={restartLogin} onSuccess={handleLoginResponse} />
      )}

      {step === LOGIN_STEP.MFA_CODE && <MfaCode onSuccess={handleLoginResponse} />}

      {step === LOGIN_STEP.VERIFICATION_CODE && (
        <VerificationCode email={email} onSuccess={handleLoginResponse} />
      )}

      {step === LOGIN_STEP.CREATE_PASSWORD && <CreatePassword onSuccess={handleLoginResponse} />}

      {step === LOGIN_STEP.SUCCESS && (
        <div className="surface-subtle grid justify-items-center gap-3 px-6 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-success/12 text-success">
            <CheckCircle2 className="size-6" aria-hidden="true" />
          </div>
          <p className="text-sm font-medium text-foreground">Login realizado com sucesso.</p>
          <p className="text-xs text-muted-foreground">Redirecionando para o seu ambiente…</p>
        </div>
      )}
    </AuthShell>
  );
}
