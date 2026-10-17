import { Combine } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Barra acima da tabela com os leads marcados para mesclar. "Mesclar" só
 * com 2.
 *
 * @param {{ total: number, onMesclar: () => void, onLimpar: () => void }} props
 */
export function BarraSelecao({ total, onMesclar, onLimpar }) {
  if (total === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2 border border-border px-3 py-2 text-sm">
      <span className="font-mono text-xs tabular-nums">
        {total} {total === 1 ? 'selecionado' : 'selecionados'}
      </span>
      {total < 2 && <span className="text-muted-foreground">Marque mais um para mesclar.</span>}
      <div className="ml-auto flex gap-2">
        <Button disabled={total < 2} onClick={onMesclar} size="sm">
          <Combine aria-hidden="true" />
          Mesclar
        </Button>
        <Button onClick={onLimpar} size="sm" variant="outline">
          Limpar seleção
        </Button>
      </div>
    </div>
  );
}
