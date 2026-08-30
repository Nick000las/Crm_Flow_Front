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
import { getFieldError, isAbortError, toApiError } from '@/services/api';
import { useContractableModules } from '../hooks/use-contractable-modules';
import { ModulesCheckboxGroup } from './modules-checkbox-group';

const SUBMIT_ERROR_ID = 'create-tenant-submit-error';

/**
 * `POST /admin/tenants` — provisiona o tenant e a conta do responsável numa
 * tacada só. O Zod do servidor é quem valida; o formulário apenas espelha as
 * mensagens de campo que voltarem.
 */
export function CreateTenantDialog({ open, onOpenChange, adminApi, onCreated }) {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modulosSelecionados, setModulosSelecionados] = useState([]);
  const { modulos, erro: erroModulos } = useContractableModules();

  function handleOpenChange(nextOpen) {
    if (!nextOpen) {
      setSubmitError(null);
      setModulosSelecionados([]);
    }

    onOpenChange(nextOpen);
  }

  function alternarModulo(moduleKey, marcado) {
    setSubmitError(null);
    setModulosSelecionados((atual) =>
      marcado
        ? [...atual, moduleKey]
        : atual.filter((chave) => chave !== moduleKey),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await adminApi.post('/admin/tenants', {
        nome: String(formData.get('nome') ?? '').trim(),
        subdomain: String(formData.get('subdomain') ?? '').trim(),
        owner: {
          nome: String(formData.get('ownerNome') ?? '').trim(),
          email: String(formData.get('ownerEmail') ?? '').trim(),
        },
        modulosContratados: modulosSelecionados,
      });

      await onCreated();
      handleOpenChange(false);
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
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Novo tenant</DialogTitle>
            <DialogDescription>
              A conta do responsável é criada junto e recebe o acesso inicial.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Campo
              disabled={isSubmitting}
              erro={getFieldError(submitError, 'nome')}
              id="tenant-nome"
              label="Nome da empresa"
              name="nome"
              onChange={() => setSubmitError(null)}
              placeholder="Acme Ltda"
            />

            <Campo
              className="font-mono"
              disabled={isSubmitting}
              erro={getFieldError(submitError, 'subdomain')}
              id="tenant-subdomain"
              label="Subdomínio"
              name="subdomain"
              onChange={() => setSubmitError(null)}
              placeholder="acme"
            />

            <fieldset className="grid gap-4 border-t border-border pt-4">
              <legend className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Responsável
              </legend>

              <Campo
                disabled={isSubmitting}
                erro={getFieldError(submitError, 'owner.nome')}
                id="tenant-owner-nome"
                label="Nome"
                name="ownerNome"
                onChange={() => setSubmitError(null)}
                placeholder="Maria Souza"
              />

              <Campo
                disabled={isSubmitting}
                erro={getFieldError(submitError, 'owner.email')}
                id="tenant-owner-email"
                label="E-mail"
                name="ownerEmail"
                onChange={() => setSubmitError(null)}
                placeholder="maria@acme.com"
                type="email"
              />
            </fieldset>

            <fieldset className="grid gap-3 border-t border-border pt-4">
              <legend className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                Módulos contratados
              </legend>

              <ModulesCheckboxGroup
                disabled={isSubmitting}
                erro={erroModulos}
                idPrefix="novo-modulo"
                modulos={modulos}
                onToggle={alternarModulo}
                selecionados={modulosSelecionados}
              />
            </fieldset>

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
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar tenant'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ erro, id, label, className, ...props }) {
  const erroId = `${id}-error`;

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        aria-describedby={erro ? erroId : undefined}
        aria-invalid={Boolean(erro)}
        className={`h-10 ${className ?? ''}`}
        id={id}
        required
        {...props}
      />
      {erro && (
        <p className="text-sm text-destructive" id={erroId}>
          {erro}
        </p>
      )}
    </div>
  );
}
