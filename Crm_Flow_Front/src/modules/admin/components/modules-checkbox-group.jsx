import { ApiErrorAlert } from '@/components/api-error-alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

/**
 * Seleção de módulos contratados, compartilhada pela criação e pela edição.
 *
 * Ao contrário dos campos de texto da casa, este é controlado em vez de lido
 * do `FormData`: o `Checkbox` do base-ui não é um input nativo, então não dá
 * para contar com a semântica de vários checkboxes de mesmo `name` virarem uma
 * lista na submissão. O estado explícito também é o que a API pede — o corpo
 * leva `modulosContratados` como array.
 */
export function ModulesCheckboxGroup({
  modulos,
  selecionados,
  onToggle,
  disabled,
  erro,
  idPrefix,
}) {
  if (erro) {
    return (
      <ApiErrorAlert
        error={erro}
        title="Não foi possível carregar os módulos"
      />
    );
  }

  if (modulos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum módulo disponível no backend.
      </p>
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {modulos.map((moduleKey) => {
        const id = `${idPrefix}-${moduleKey}`;

        return (
          <div className="flex items-center gap-2.5" key={moduleKey}>
            <Checkbox
              checked={selecionados.includes(moduleKey)}
              disabled={disabled}
              id={id}
              onCheckedChange={(marcado) => onToggle(moduleKey, marcado)}
            />
            <Label className="font-mono text-xs font-normal" htmlFor={id}>
              {moduleKey}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
