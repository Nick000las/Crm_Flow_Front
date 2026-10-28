import { Badge } from '@/components/ui/badge';
import { marcadorPrecisaContorno } from '@/lib/contraste';
import { cn } from '@/lib/utils';
import { useFaixasScore } from '../hooks/use-score';
import { formatarNumero } from '../lib/formatadores';
import { faixaDoScore } from '../lib/score';

/**
 * Lead score com a faixa (`crm.score`): marcador com a cor da faixa, rótulo
 * em grafite e o número em mono — a cor nunca é a única pista (no visual do
 * `OpcaoBadge`). Sem a flag, sem as faixas ou fora de toda faixa: só o
 * número, como antes.
 *
 * @param {{ valor: unknown }} props `lead_score` (pode vir como string decimal)
 */
export function SeloScore({ valor }) {
  const faixa = faixaDoScore(useFaixasScore(), valor);
  const numero = formatarNumero(valor) ?? String(valor);

  if (!faixa) return <span className="font-mono tabular-nums">{numero}</span>;

  return (
    <Badge
      className="gap-1.5 rounded-none border-border px-1.5 text-[11px] font-normal text-foreground"
      variant="outline"
    >
      <span
        aria-hidden="true"
        className={cn('size-1.5 shrink-0', marcadorPrecisaContorno(faixa.cor) && 'outline outline-1 outline-foreground/40')}
        style={{ backgroundColor: faixa.cor }}
      />
      {faixa.rotulo}
      <span className="font-mono tabular-nums text-muted-foreground">{numero}</span>
    </Badge>
  );
}
