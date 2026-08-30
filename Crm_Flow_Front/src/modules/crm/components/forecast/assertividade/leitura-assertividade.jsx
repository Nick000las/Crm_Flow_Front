import { textoDeLeitura } from '../../../lib/assertividade';
import { TEXTOS_ASSERTIVIDADE } from '../../../lib/assertividade-textos';

/**
 * "Como ler": a frase do mês aberto (se houver) e as duas ajudas fixas.
 *
 * @param {{ mes?: import('../../../api/assertividade.api').MesAssertividade | null }} props
 */
export function LeituraAssertividade({ mes }) {
  return (
    <div className="grid gap-2 rounded-xl border border-border bg-surface p-4 text-sm">
      {mes && <p className="text-foreground">{textoDeLeitura(mes)}</p>}
      <p className="text-xs text-muted-foreground">{TEXTOS_ASSERTIVIDADE.ajudaSnapshot}</p>
      <p className="text-xs text-muted-foreground">{TEXTOS_ASSERTIVIDADE.ajudaLeitura}</p>
    </div>
  );
}
