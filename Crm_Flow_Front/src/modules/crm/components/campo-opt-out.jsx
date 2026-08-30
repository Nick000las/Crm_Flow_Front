import { Checkbox } from '@/components/ui/checkbox';
import { formatarInstante } from '../lib/formatadores';

/**
 * Opt-out de marketing (LGPD, `crm.lgpd`) — não é campo de `/fields`: vai
 * no payload como `optOutMarketing` (sim/não) e o back carimba a data.
 * Religar mantém a data da primeira vez.
 *
 * @param {{
 *   id: string,
 *   value: boolean,
 *   onChange: (marcado: boolean) => void,
 *   desde?: string | null,
 *   erro?: string | null,
 * }} props `desde`: `marketing_opt_out_at` do lead salvo
 */
export function CampoOptOut({ id, value, onChange, desde, erro }) {
  const ajudaId = `${id}-ajuda`;
  const erroId = `${id}-erro`;
  const data = desde ? formatarInstante(desde) : null;

  return (
    <div className="grid gap-1.5">
      <label className="flex items-center gap-2 text-sm" htmlFor={id}>
        <Checkbox
          aria-describedby={
            [data && ajudaId, erro && erroId].filter(Boolean).join(' ') || undefined
          }
          aria-invalid={erro ? true : undefined}
          checked={value}
          id={id}
          onCheckedChange={(marcado) => onChange(Boolean(marcado))}
        />
        Não quer receber comunicações de marketing
      </label>
      {data && (
        <p className="text-xs text-muted-foreground" id={ajudaId}>
          Pediu para sair em {data}.
        </p>
      )}
      {erro && (
        <p className="text-xs text-destructive" id={erroId}>
          {erro}
        </p>
      )}
    </div>
  );
}
