import { ModalPresence } from '@/components/motion/modal-presence';
import { Form } from '@/components/ui/form';
import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { isAbortError, toApiError } from '@/services/api';
import { TENANT_STATUS_OPTIONS, getTenantStatusLabel } from '../lib/tenant-status';
import { TenantStatusBadge } from './tenant-status-badge';

const SUBMIT_ERROR_ID = 'tenant-status-error';
const STATUS_RESTRITIVOS = new Set(['suspenso', 'cancelado']);

/** `PUT /admin/tenants/:id/status` */
export function TenantStatusSection({ tenant, adminApi, onSaved }) {
  const [status, setStatus] = useState(tenant.status ?? '');
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmandoStatus, setConfirmandoStatus] = useState(false);

  // Um status vindo do backend que o front ainda não conhece continua
  // selecionável em vez de desaparecer da lista.
  const opcoes = TENANT_STATUS_OPTIONS.includes(status)
    ? TENANT_STATUS_OPTIONS
    : [...TENANT_STATUS_OPTIONS, status].filter(Boolean);
  const inalterado = status === tenant.status;
  const exigeConfirmacao = STATUS_RESTRITIVOS.has(status);

  async function aplicarStatus() {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await adminApi.put(`/admin/tenants/${tenant.id}/status`, { status });
      await onSaved();
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
        throw error;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (inalterado || isSubmitting) {
      return;
    }

    if (exigeConfirmacao) {
      setConfirmandoStatus(true);
      return;
    }

    try {
      await aplicarStatus();
    } catch {
      // Erro já exibido em ApiErrorAlert.
    }
  }

  const labelStatus = getTenantStatusLabel(status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-6">
          <div className="grid gap-1">
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Suspender bloqueia o acesso do tenant sem apagar nada.
            </CardDescription>
          </div>
          <TenantStatusBadge status={tenant.status} />
        </div>
      </CardHeader>

      <CardContent>
        <Form className="grid gap-4" noValidate onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="tenant-status">Novo status</Label>
            <Select
              disabled={isSubmitting}
              onValueChange={(valor) => {
                setSubmitError(null);
                setStatus(valor);
              }}
              value={status}
            >
              <SelectTrigger className="h-10 w-full sm:w-64" id="tenant-status">
                <SelectValue>{(valor) => getTenantStatusLabel(valor)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {opcoes.map((opcao) => (
                  <SelectItem key={opcao} value={opcao}>
                    {getTenantStatusLabel(opcao)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

          <div>
            <Button
              variant={exigeConfirmacao && !inalterado ? 'destructive' : 'default'}
              loading={isSubmitting}
              loadingText="Aplicando…"
              disabled={isSubmitting || inalterado}
              type="submit"
            >
              Aplicar status
            </Button>
          </div>
        </Form>
      </CardContent>

      <ModalPresence>
        {confirmandoStatus && (
          <ConfirmationDialog
            title={`Alterar status de ${tenant.nome} para ${labelStatus}?`}
            description={
              status === 'cancelado'
                ? `Todos os usuários de ${tenant.nome} perderão imediatamente o acesso à plataforma até que o status seja reativado.`
                : `O acesso de todos os usuários de ${tenant.nome} será bloqueado imediatamente. Os dados serão preservados.`
            }
            confirmLabel={status === 'cancelado' ? 'Cancelar tenant' : 'Suspender tenant'}
            pendingLabel="Aplicando…"
            onConfirm={aplicarStatus}
            onClose={() => setConfirmandoStatus(false)}
          />
        )}
      </ModalPresence>
    </Card>
  );
}
