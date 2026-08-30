import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { isAbortError, toApiError } from '@/services/api';
import { DisableMfaDialog } from './disable-mfa-dialog';

const SUBMIT_ERROR_ID = 'mfa-section-error';

export function MfaSection({ initialEnabled, syncMfaEnabled, authApi }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);

  /**
   * Confirmação do backend sobe para o contexto além do estado local: a
   * página remonta a cada navegação e é reeseedada por `mfaEnabled`. Sem
   * isso, ligar o MFA e voltar para cá mostraria o toggle desligado de novo.
   */
  function commit(nextEnabled) {
    setEnabled(nextEnabled);
    syncMfaEnabled(nextEnabled);
  }

  async function handleCheckedChange(nextEnabled) {
    setSubmitError(null);

    if (!nextEnabled) {
      // Desligar exige senha — o Switch só muda depois do diálogo confirmar.
      setIsDisableDialogOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Ligar não tem fricção extra: aumentar a segurança não pede senha.
      await authApi.put('/auth/mfa');
      commit(true);
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-6">
          <div className="grid gap-1">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Verificação em duas etapas
            </CardTitle>
            <CardDescription>
              Ao entrar, enviamos um código de 6 dígitos para o seu e-mail.
            </CardDescription>
          </div>

          <Switch
            checked={enabled}
            disabled={isSubmitting}
            onCheckedChange={handleCheckedChange}
            aria-label="Verificação em duas etapas por e-mail"
          />
        </div>
      </CardHeader>

      <CardContent className="grid gap-4">
        <p className="text-sm text-muted-foreground">
          Status:{' '}
          <span className="font-medium text-foreground">
            {enabled ? 'Ativada' : 'Desativada'}
          </span>
        </p>

        <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />
      </CardContent>

      <DisableMfaDialog
        open={isDisableDialogOpen}
        onOpenChange={setIsDisableDialogOpen}
        authApi={authApi}
        onDisabled={() => commit(false)}
      />
    </Card>
  );
}
