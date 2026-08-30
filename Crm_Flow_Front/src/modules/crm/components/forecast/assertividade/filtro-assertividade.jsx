import { FieldError } from '@/components/field-error';
import { useId } from 'react';
import { Input } from '@/components/ui/input';

const ROTULO = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function Campo({ rotulo, erro, children, id }) {
  return (
    <div className="grid min-w-36 flex-1 gap-1.5 sm:max-w-56">
      <label className={ROTULO} htmlFor={id}>
        {rotulo}
      </label>
      {children}
      <FieldError id={`${id}-erro`} message={erro} />
    </div>
  );
}

/**
 * Período da assertividade (só meses fechados). O pai valida (`erros`) e dá o
 * último mês fechado em `max`.
 *
 * @param {{
 *   de: string,
 *   ate: string,
 *   max?: string,
 *   erros?: { de?: string, ate?: string },
 *   onPeriodo: (periodo: { de: string, ate: string }) => void,
 * }} props
 */
export function FiltroAssertividade({ de, ate, max, erros = {}, onPeriodo }) {
  const base = useId();
  const ids = { de: `${base}-de`, ate: `${base}-ate` };

  return (
    <div className="flex flex-wrap items-start gap-3">
      <Campo erro={erros.de} id={ids.de} rotulo="De">
        <Input
          aria-describedby={erros.de ? `${ids.de}-erro` : undefined}
          aria-invalid={Boolean(erros.de)}
          className="h-9"
          id={ids.de}
          max={max}
          onChange={(event) => onPeriodo({ de: event.target.value, ate })}
          type="month"
          value={de}
        />
      </Campo>
      <Campo erro={erros.ate} id={ids.ate} rotulo="Até">
        <Input
          aria-describedby={erros.ate ? `${ids.ate}-erro` : undefined}
          aria-invalid={Boolean(erros.ate)}
          className="h-9"
          id={ids.ate}
          max={max}
          onChange={(event) => onPeriodo({ de, ate: event.target.value })}
          type="month"
          value={ate}
        />
      </Campo>
    </div>
  );
}
