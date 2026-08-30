import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isAbortError, toApiError } from '@/services/api';

const CONFIRM_ERROR_ID = 'delete-tenant-confirm-error';
const SUBMIT_ERROR_ID = 'delete-tenant-submit-error';

/**
 * `DELETE /admin/tenants/:id`.
 *
 * Digitar o subdomínio é a trava: é o gesto mais destrutivo da área master e
 * não pode depender de acertar um botão. Mesma lógica do `DisableMfaDialog`,
 * que pede a senha para reduzir proteção — aqui a confirmação é local, já que
 * o backend não exige credencial nesta rota.
 */
export function DeleteTenantDialog({
  open,
  onOpenChange,
  adminApi,
  tenant,
  onDeleted,
}) {
  const [submitError, setSubmitError] = useState(null);
  const [confirmacaoError, setConfirmacaoError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setSubmitError(null);
      setConfirmacaoError(null);
    }

    onOpenChange(nextOpen);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const confirmacao = String(formData.get('confirmacao') ?? '').trim();

    setSubmitError(null);
    setConfirmacaoError(null);

    if (confirmacao !== tenant.subdomain) {
      setConfirmacaoError('O subdomínio não confere.');
      return;
    }

    setIsSubmitting(true);

    try {
      await adminApi.delete(`/admin/tenants/${tenant.id}`);

      await onDeleted();
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Excluir tenant</DialogTitle>
            <DialogDescription>
              Remove {tenant.nome} e os dados associados. A ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delete-tenant-confirm">
                Digite{' '}
                <span className="font-mono text-foreground">
                  {tenant.subdomain}
                </span>{' '}
                para confirmar
              </Label>
              <Input
                aria-describedby={
                  confirmacaoError ? CONFIRM_ERROR_ID : undefined
                }
                aria-invalid={Boolean(confirmacaoError)}
                autoComplete="off"
                className="h-10 font-mono"
                disabled={isSubmitting}
                id="delete-tenant-confirm"
                name="confirmacao"
                onChange={() => setConfirmacaoError(null)}
                required
              />
              {confirmacaoError && (
                <p className="text-sm text-destructive" id={CONFIRM_ERROR_ID}>
                  {confirmacaoError}
                </p>
              )}
            </div>

            <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              }
            />
            <Button
              aria-busy={isSubmitting}
              disabled={isSubmitting}
              type="submit"
              variant="destructive"
            >
              {isSubmitting ? 'Excluindo...' : 'Excluir tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
