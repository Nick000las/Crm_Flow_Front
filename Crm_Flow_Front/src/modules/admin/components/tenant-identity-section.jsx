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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getFieldError, isAbortError, toApiError } from '@/services/api';

const SUBMIT_ERROR_ID = 'tenant-identity-error';

/**
 * `PUT /admin/tenants/:id` — todos os campos são opcionais no backend, então o
 * formulário manda só o que foi preenchido.
 *
 * `temaJson` fica de fora: o tema por tenant está declarado como etapa futura
 * no CLAUDE.md, e um textarea de JSON cru aqui seria uma porta de entrada para
 * dado inválido antes de a feature existir.
 */
export function TenantIdentitySection({ tenant, adminApi, onSaved }) {
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [salvo, setSalvo] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const retencao = String(formData.get('retencaoConversaMeses') ?? '').trim();

    setSubmitError(null);
    setSalvo(false);
    setIsSubmitting(true);

    // Campo vazio é omitido do corpo, não enviado como `null`: no backend todos
    // são opcionais, e mandar `null` num schema que só aceita ausência faria
    // toda edição de nome falhar em tenant sem domínio próprio. O efeito
    // colateral é que esvaziar um campo aqui não o apaga — limpar um valor já
    // gravado é gesto que ainda não tem rota própria.
    const payload = somenteCamposPreenchidos({
      nome: String(formData.get('nome') ?? '').trim(),
      dominioCustomizado: String(formData.get('dominioCustomizado') ?? '').trim(),
      dataRegion: String(formData.get('dataRegion') ?? '').trim(),
      retencaoConversaMeses: retencao === '' ? '' : Number(retencao),
    });

    try {
      await adminApi.put(`/admin/tenants/${tenant.id}`, payload);

      await onSaved();
      setSalvo(true);
    } catch (error) {
      if (!isAbortError(error)) {
        setSubmitError(toApiError(error));
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function limpar() {
    setSubmitError(null);
    setSalvo(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identidade</CardTitle>
        <CardDescription>
          Dados de exibição e de residência dos dados deste tenant.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <Campo
            defaultValue={tenant.nome ?? ''}
            disabled={isSubmitting}
            erro={getFieldError(submitError, 'nome')}
            id="tenant-edit-nome"
            label="Nome da empresa"
            name="nome"
            onChange={limpar}
          />

          <Campo
            className="font-mono"
            defaultValue={tenant.dominioCustomizado ?? ''}
            disabled={isSubmitting}
            erro={getFieldError(submitError, 'dominioCustomizado')}
            id="tenant-edit-dominio"
            label="Domínio customizado"
            name="dominioCustomizado"
            onChange={limpar}
            placeholder="app.acme.com"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              className="font-mono"
              defaultValue={tenant.dataRegion ?? ''}
              disabled={isSubmitting}
              erro={getFieldError(submitError, 'dataRegion')}
              id="tenant-edit-region"
              label="Região dos dados"
              name="dataRegion"
              onChange={limpar}
              placeholder="br-south"
            />

            <Campo
              className="font-mono"
              defaultValue={tenant.retencaoConversaMeses ?? ''}
              disabled={isSubmitting}
              erro={getFieldError(submitError, 'retencaoConversaMeses')}
              id="tenant-edit-retencao"
              label="Retenção de conversas (meses)"
              min="1"
              name="retencaoConversaMeses"
              onChange={limpar}
              placeholder="12"
              type="number"
            />
          </div>

          <ApiErrorAlert error={submitError} id={SUBMIT_ERROR_ID} />

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
            </Button>
            {salvo && (
              <p className="text-sm text-muted-foreground" role="status">
                Alterações salvas.
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/** Descarta as chaves que o formulário deixou em branco. */
function somenteCamposPreenchidos(valores) {
  return Object.fromEntries(
    Object.entries(valores).filter(([, valor]) => valor !== ''),
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
