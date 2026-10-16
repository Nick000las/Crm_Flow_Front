import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { isAbortError, toApiError } from '@/services/api';
import { useFeatureCatalog } from '../hooks/use-feature-catalog';
import { agruparFeaturesPorModulo, mesmoConjunto } from '../lib/features';

const SUBMIT_ERROR_ID = 'tenant-features-error';

/**
 * `PUT /admin/tenants/:id/features` substitui o conjunto inteiro de flags
 * ligadas — lista vazia desliga tudo (kill switch).
 *
 * Flag é rollout gradual de funcionalidade nova, não plano pago: ligar aqui
 * libera a funcionalidade para este tenant antes dos demais. Flag de módulo
 * não contratado pode ser ligada (prepara o rollout), mas não tem efeito
 * até o módulo ser contratado — por isso aparece marcada como tal.
 */
export function TenantFeaturesSection({ tenant, adminApi, onSaved }) {
  const ligadas = Array.isArray(tenant.features) ? tenant.features : [];
  const contratados = Array.isArray(tenant.modulosContratados) ? tenant.modulosContratados : [];
  const [selecionadas, setSelecionadas] = useState(ligadas);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { catalogo, carregando, erro: erroCatalogo } = useFeatureCatalog(adminApi);

  const grupos = agruparFeaturesPorModulo(catalogo);

  function alternar(featureKey, marcado) {
    setSubmitError(null);
    setSelecionadas((atual) =>
      marcado ? [...atual, featureKey] : atual.filter((chave) => chave !== featureKey),
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await adminApi.put(`/admin/tenants/${tenant.id}/features`, {
        features: selecionadas,
      });
      await onSaved();
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
        <CardTitle>Feature flags</CardTitle>
        <CardDescription>
          Libera funcionalidades novas para este tenant antes dos demais.
          Desligar volta ao comportamento anterior na hora.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          {erroCatalogo ? (
            <ApiErrorAlert
              error={erroCatalogo}
              title="Não foi possível carregar o catálogo de flags"
            />
          ) : carregando ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : grupos.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum módulo declara feature flags.
            </p>
          ) : (
            grupos.map(({ moduleKey, features }) => (
              <fieldset className="grid gap-3" key={moduleKey}>
                <legend className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {moduleKey}
                  {!contratados.includes(moduleKey) && ' · não contratado'}
                </legend>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {features.map((featureKey) => {
                    const id = `tenant-feature-${tenant.id}-${featureKey}`;

                    return (
                      <div className="flex items-center gap-2.5" key={featureKey}>
                        <Checkbox
                          checked={selecionadas.includes(featureKey)}
                          disabled={isSubmitting}
                          id={id}
                          onCheckedChange={(marcado) => alternar(featureKey, marcado)}
                        />
                        <Label className="font-mono text-xs font-normal" htmlFor={id}>
                          {featureKey}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </fieldset>
            ))
          )}

          <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

          <div>
            <Button
              aria-busy={isSubmitting}
              disabled={isSubmitting || mesmoConjunto(selecionadas, ligadas)}
              type="submit"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar flags'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
