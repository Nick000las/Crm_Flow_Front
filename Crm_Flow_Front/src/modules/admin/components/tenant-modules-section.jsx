import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useState } from 'react';
import { X } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { isAbortError, toApiError } from '@/services/api';
import { useContractableModules } from '../hooks/use-contractable-modules';
import { ModulesCheckboxGroup } from './modules-checkbox-group';

const SUBMIT_ERROR_ID = 'tenant-modules-error';

/**
 * `PUT /admin/tenants/:id/modules` substitui a lista inteira;
 * `DELETE /admin/tenants/:id/modules/:moduleKey` remove um só. Os contratados
 * hoje aparecem como fichas removíveis, e a lista de marcação serve para
 * redefinir o conjunto — as duas rotas descrevem gestos diferentes, então cada
 * uma tem seu próprio controle em vez de uma virar atalho da outra.
 */
export function TenantModulesSection({ tenant, adminApi, onSaved }) {
  const contratados = Array.isArray(tenant.modulosContratados) ? tenant.modulosContratados : [];
  const [selecionados, setSelecionados] = useState(contratados);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removendo, setRemovendo] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const { modulos, carregando: loadingModules, erro: erroModulos } = useContractableModules();

  const inalterado =
    selecionados.length === contratados.length &&
    selecionados.every((chave) => contratados.includes(chave));

  function alternarModulo(moduleKey, marcado) {
    setSubmitError(null);
    setSelecionados((atual) =>
      marcado ? [...atual, moduleKey] : atual.filter((chave) => chave !== moduleKey),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    const removed = contratados.filter((key) => !selecionados.includes(key));
    if (removed.length) {
      setSubmitError(null);
      setPendingRemoval({ kind: 'selection', removed, selected: [...selecionados] });
      return;
    }
    salvarModulos([...selecionados]);
  }

  async function salvarModulos(modules) {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await adminApi.put(`/admin/tenants/${tenant.id}/modules`, { modulosContratados: modules });
      setPendingRemoval(null);
      await onSaved();
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function removerModulo(moduleKey) {
    setSubmitError(null);
    setRemovendo(moduleKey);

    try {
      await adminApi.delete(`/admin/tenants/${tenant.id}/modules/${moduleKey}`);
      setSelecionados((atual) => atual.filter((chave) => chave !== moduleKey));
      setPendingRemoval(null);
      await onSaved();
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
      return false;
    } finally {
      setRemovendo(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Módulos</CardTitle>
        <CardDescription>Define o que este tenant enxerga na plataforma.</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="grid gap-2">
          <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            Contratados
          </p>

          {contratados.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum módulo contratado.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {contratados.map((moduleKey) => (
                <li
                  className="flex items-center gap-1 border border-border py-1 pl-2.5 pr-1 font-mono text-xs"
                  key={moduleKey}
                >
                  {moduleKey}
                  <Button
                    aria-label={`Remover módulo ${moduleKey}`}
                    className="size-5"
                    disabled={isSubmitting || Boolean(removendo)}
                    loading={removendo === moduleKey}
                    onClick={() => {
                      setSubmitError(null);
                      setPendingRemoval({ kind: 'single', moduleKey });
                    }}
                    size="icon-xs"
                    type="button"
                    variant="destructive"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="grid gap-4 border-t border-border pt-6" onSubmit={handleSubmit}>
          <fieldset className="grid gap-3">
            <legend className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Redefinir contratação
            </legend>

            <ModulesCheckboxGroup
              loading={loadingModules}
              disabled={isSubmitting || Boolean(removendo)}
              erro={erroModulos}
              idPrefix={`tenant-modulo-${tenant.id}`}
              modulos={modulos}
              onToggle={alternarModulo}
              selecionados={selecionados}
            />
          </fieldset>

          <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

          <div>
            <Button
              loading={isSubmitting}
              disabled={isSubmitting || Boolean(removendo) || inalterado || loadingModules}
              type="submit"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar módulos'}
            </Button>
          </div>
        </form>
      </CardContent>
      {pendingRemoval && (
        <ConfirmationDialog
          title="Remover acesso a módulos?"
          description={
            pendingRemoval.kind === 'single'
              ? `O acesso ao módulo “${pendingRemoval.moduleKey}” será desativado para esta empresa.`
              : `Os usuários deixarão de acessar os módulos: ${pendingRemoval.removed.join(', ')}.`
          }
          confirmLabel="Remover acesso"
          pendingLabel="Removendo acesso…"
          busy={isSubmitting || Boolean(removendo)}
          error={submitError?.message}
          onConfirm={() =>
            pendingRemoval.kind === 'single'
              ? removerModulo(pendingRemoval.moduleKey)
              : salvarModulos(pendingRemoval.selected)
          }
          onClose={() => setPendingRemoval(null)}
        />
      )}
    </Card>
  );
}
