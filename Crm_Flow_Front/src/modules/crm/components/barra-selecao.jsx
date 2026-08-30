/**
 * @file Barra acima da tabela com os leads marcados. As ações dependem do que está ligado:
 * "Editar em massa" (`crm.massa`) e "Mesclar" (gestão com `crm.duplicidade`, só com exatamente
 * 2).
 */
import { Combine, PencilLine } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PARA_MESCLAR = 2;

/**
 * Barra acima da tabela com os leads marcados. As ações dependem do que está
 * ligado: "Editar em massa" (`crm.massa`) e "Mesclar" (gestão com
 * `crm.duplicidade`, só com exatamente 2).
 */
export function BarraSelecao({
  total,
  onLimpar,
  onEditarEmMassa,
  onMesclar,
  bloqueioMesclar = null,
}) {
  const dicaMesclar = onMesclar && !bloqueioMesclar && total !== PARA_MESCLAR;

  return total > 0 ? (
    <div className="sticky bottom-4 z-30 mt-3 flex flex-wrap items-center gap-2.5 rounded-xl border border-primary/30 bg-popover/95 px-4 py-2.5 text-sm shadow-lg backdrop-blur-sm">
      <Badge variant="secondary" className="text-xs tabular-nums" role="status">
        {total} {total === 1 ? 'selecionado' : 'selecionados'}
      </Badge>
      {dicaMesclar && (
        <span className="text-xs text-muted-foreground">
          {total < PARA_MESCLAR
            ? 'Marque mais um para mesclar.'
            : 'Mesclar exige exatamente 2 leads.'}
        </span>
      )}
      {onMesclar && bloqueioMesclar && (
        <span className="text-xs text-muted-foreground">{bloqueioMesclar}</span>
      )}
      <div className="ml-auto flex flex-wrap gap-2">
        {onEditarEmMassa && (
          <Button onClick={onEditarEmMassa} size="sm">
            <PencilLine aria-hidden="true" />
            Editar em massa
          </Button>
        )}
        {onMesclar && (
          <Button
            disabled={total !== PARA_MESCLAR || Boolean(bloqueioMesclar)}
            onClick={onMesclar}
            size="sm"
            title={
              bloqueioMesclar ??
              (total !== PARA_MESCLAR ? 'Mesclar exige exatamente 2 leads' : undefined)
            }
            variant={onEditarEmMassa ? 'outline' : 'default'}
          >
            <Combine aria-hidden="true" />
            Mesclar
          </Button>
        )}
        <Button onClick={onLimpar} size="sm" variant="outline">
          Limpar seleção
        </Button>
      </div>
    </div>
  ) : null;
}
