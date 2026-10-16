import { Badge } from '@/components/ui/badge';
import { marcadorPrecisaContorno } from '@/lib/contraste';
import { cn } from '@/lib/utils';

/**
 * Sem cor própria, só `ganho` e `perdido` ganham tom: carregam significado.
 * O resto fica no cinza da interface.
 */
const TOM_POR_CATEGORIA = Object.freeze({
  ganho: 'text-emerald-700 dark:text-emerald-400',
  perdido: 'text-destructive',
});

/**
 * Selo de opção: borda de 1px, canto reto, texto sempre grafite. A cor da
 * opção (Configurações › Listas) aparece só no marcador — a tabela continua
 * sóbria e o texto nunca depende da cor para ser lido. Cor clara demais
 * ganha contorno (contraste de elemento gráfico, WCAG 1.4.11).
 *
 * @param {{ opcao: import('../lib/opcoes').Opcao, className?: string }} props
 */
export function OpcaoBadge({ opcao, className }) {
  const tom = opcao.color ? null : TOM_POR_CATEGORIA[opcao.category];
  const temMarcador = Boolean(opcao.color || tom);

  return (
    <Badge
      className={cn(
        'gap-1.5 rounded-none border-border px-1.5 text-[11px] font-normal',
        tom ?? 'text-foreground',
        className,
      )}
      variant="outline"
    >
      {temMarcador && (
        <span
          aria-hidden="true"
          className={cn(
            'size-1.5 shrink-0',
            tom && 'bg-current',
            marcadorPrecisaContorno(opcao.color) && 'outline outline-1 outline-foreground/40',
          )}
          style={opcao.color ? { backgroundColor: opcao.color } : undefined}
        />
      )}
      {opcao.label}
      {!opcao.ativo && (
        <span className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
          <span className="sr-only">, opção </span>inativa
        </span>
      )}
    </Badge>
  );
}
