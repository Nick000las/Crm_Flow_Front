/**
 * @file Ciclo de vida do lead (FC4): "Lead", "Em negociação", "Cliente" ou "Cliente desde
 * mm/aaaa". Cliente leva um marcador no tom de "ganho"; o texto é sempre grafite e sempre
 * aparece (nunca só cor). Ciclo ausente ou desconhecido não renderiza (nunca vira "Lead").
 */
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

import { CICLOS_DE_VIDA } from '../constants';
import { textoDoCiclo } from '../lib/ciclo-de-vida';

/**
 * Ciclo de vida do lead (FC4): "Lead", "Em negociação", "Cliente" ou
 * "Cliente desde mm/aaaa". Cliente leva um marcador no tom de "ganho"; o texto
 * é sempre grafite e sempre aparece (nunca só cor). Ciclo ausente ou
 * desconhecido não renderiza (nunca vira "Lead").
 *
 * @param {{
 *   lead: Pick<import('../types').Lead, 'ciclo_de_vida' | 'cliente_desde'> | null | undefined,
 *   fuso?: string,
 *   className?: string,
 * }} props
 */
export function SeloCiclo({ lead, fuso, className }) {
  const resultado = textoDoCiclo(lead, fuso);

  if (!resultado) {
    return null;
  }

  return (
    <Badge
      className={cn('gap-1.5 border-border px-1.5 text-[11px] font-normal', className)}
      variant="outline"
    >
      {resultado.ciclo === CICLOS_DE_VIDA.CLIENTE && (
        <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-success" />
      )}
      {resultado.texto}
    </Badge>
  );
}
