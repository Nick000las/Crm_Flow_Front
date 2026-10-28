import { ShieldOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatarInstante } from '../lib/formatadores';

/**
 * "Anonimizado" (LGPD): o lead perdeu os dados pessoais a pedido do
 * titular; não edita nem mescla. Some quando `anonimizadoEm` é nulo.
 *
 * @param {{ anonimizadoEm?: string | null, className?: string }} props
 */
export function SeloAnonimizado({ anonimizadoEm, className }) {
  if (!anonimizadoEm) return null;
  const data = formatarInstante(anonimizadoEm);

  return (
    <Badge
      className={cn('gap-1 rounded-none border-border px-1.5 text-[11px] font-normal text-muted-foreground', className)}
      title={data ? `Anonimizado em ${data}` : undefined}
      variant="outline"
    >
      <ShieldOff aria-hidden="true" className="size-3" />
      Anonimizado
    </Badge>
  );
}
