import { Pencil, Trash2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { estaAtrasada, estaConcluida, opcaoDoTipo } from '../../lib/atividades';
import { formatarInstante } from '../../lib/formatadores';
import { BotaoIcone } from '../botao-icone';
import { OpcaoBadge } from '../opcao-badge';

const DADO = 'font-mono text-xs tabular-nums';

/** Quando: a conclusão, se concluída; senão, a agenda (com "atrasada"). */
function Quando({ atividade }) {
  if (estaConcluida(atividade)) {
    return <span className={DADO}>Concluída em {formatarInstante(atividade.concluidaEm)}</span>;
  }
  if (!atividade.agendadaPara) return <span>Sem data</span>;

  const atrasada = estaAtrasada(atividade);
  return (
    <span className={cn(DADO, atrasada && 'text-destructive')}>
      {atrasada ? 'Atrasada · ' : ''}
      {formatarInstante(atividade.agendadaPara)}
    </span>
  );
}

/**
 * Uma atividade: checkbox de concluir/reabrir, tipo, título, notas, quando
 * e quem registrou.
 *
 * @param {{
 *   atividade: import('../../api/atividades.api').Atividade,
 *   tipos: import('../../lib/opcoes').Opcao[] | undefined,
 *   ocupado: boolean,
 *   onAlternar: (concluida: boolean) => void,
 *   onEditar: () => void,
 *   onExcluir: () => void,
 * }} props
 */
export function ItemAtividade({ atividade, tipos, ocupado, onAlternar, onEditar, onExcluir }) {
  const concluida = estaConcluida(atividade);
  const id = `atividade-${atividade.id}`;

  return (
    <li className="flex gap-3 border-b border-border py-3 last:border-b-0">
      <Checkbox
        aria-busy={ocupado}
        aria-label={`${concluida ? 'Reabrir' : 'Concluir'} ${atividade.titulo}`}
        checked={concluida}
        className="mt-0.5"
        disabled={ocupado}
        id={id}
        onCheckedChange={(marcado) => onAlternar(Boolean(marcado))}
      />

      <div className="grid min-w-0 flex-1 gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <OpcaoBadge opcao={opcaoDoTipo(tipos, atividade.tipo)} />
          <p className={cn('min-w-0 break-words text-sm font-medium', concluida && 'text-muted-foreground line-through')}>
            {atividade.titulo}
          </p>
        </div>
        {atividade.notas && <p className="text-sm break-words whitespace-pre-line">{atividade.notas}</p>}
        <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          <Quando atividade={atividade} />
          <span>· {atividade.autor?.nome ?? 'Sistema'}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-start">
        <BotaoIcone icone={Pencil} onClick={onEditar} rotulo={`Editar ${atividade.titulo}`} />
        <BotaoIcone icone={Trash2} onClick={onExcluir} rotulo={`Remover ${atividade.titulo}`} />
      </div>
    </li>
  );
}
