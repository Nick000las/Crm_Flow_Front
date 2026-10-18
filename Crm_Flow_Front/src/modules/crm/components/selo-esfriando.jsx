import { Snowflake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { textoEsfriando } from '../lib/inatividade';
import { formatarInstante } from '../lib/formatadores';

/**
 * "Esfriando há N dias" (`crm.inatividade`). Só mostra o que o back manda:
 * sem `esfriando_desde` (lead em dia ou flag desligada), não renderiza.
 *
 * @param {{ esfriandoDesde: string | null | undefined, className?: string }} props
 */
export function SeloEsfriando({ esfriandoDesde, className }) {
  const texto = textoEsfriando(esfriandoDesde);
  if (!texto) return null;

  return (
    <Badge
      className={cn('rounded-none border-border px-1.5 text-[11px] font-normal text-muted-foreground', className)}
      title={`Esfriando desde ${formatarInstante(esfriandoDesde) ?? ''}`}
      variant="outline"
    >
      <Snowflake aria-hidden="true" />
      {texto}
    </Badge>
  );
}
