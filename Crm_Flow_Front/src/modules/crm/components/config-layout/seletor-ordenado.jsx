import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { moverPara } from '../../lib/ordem';
import { BotaoIcone } from '../botao-icone';
import { BotoesOrdem } from '../ordenavel/botoes-ordem';
import { ListaOrdenavel } from '../ordenavel/lista-ordenavel';
import { PuxadorOrdem } from '../ordenavel/puxador-ordem';
import { useLinhaOrdenavel } from '../ordenavel/use-linha-ordenavel';
import { SelectSimples } from '../select-simples';

const INDISPONIVEL = 'Campo indisponível';

function ItemEscolhido({ itemRef, rotulo, indice, total, onMover, onRemover }) {
  const { linha, puxador } = useLinhaOrdenavel(itemRef, false);

  return (
    <li
      {...linha}
      className={cn('flex items-center gap-1 border-b border-border py-1 pr-1 pl-0.5 last:border-b-0', linha.className)}
    >
      <PuxadorOrdem {...puxador} rotulo={rotulo} />
      <span className={cn('flex-1 text-sm', rotulo === INDISPONIVEL && 'text-muted-foreground italic')}>
        {rotulo}
      </span>
      <BotoesOrdem desabilitado={false} indice={indice} onMover={onMover} rotulo={rotulo} total={total} />
      <BotaoIcone icone={X} onClick={onRemover} rotulo={`Remover ${rotulo}`} />
    </li>
  );
}

/**
 * Lista ordenada de campos escolhidos (subtítulo, destaques, colunas, campos
 * de uma seção): arrastar ou ↑/↓, remover, e "Adicionar campo" com o que
 * ainda não está na lista. Ref que deixou de existir aparece como
 * "Campo indisponível" — dá para ver e tirar.
 *
 * @param {{
 *   id: string,
 *   legenda: string,
 *   ajuda?: string,
 *   valor: string[],
 *   opcoes: { ref: string, label: string }[],
 *   max?: number,
 *   erro?: string | null,
 *   onChange: (refs: string[]) => void,
 * }} props
 */
export function SeletorOrdenado({ id, legenda, ajuda, valor, opcoes, max, erro, onChange }) {
  const porRef = new Map(opcoes.map((opcao) => [opcao.ref, opcao.label]));
  const rotuloDe = (ref) => porRef.get(ref) ?? INDISPONIVEL;
  const disponiveis = opcoes
    .filter((opcao) => !valor.includes(opcao.ref))
    .map((opcao) => ({ valor: opcao.ref, rotulo: opcao.label }));
  const cheio = max !== undefined && valor.length >= max;
  const erroId = `${id}-erro`;
  const ajudaId = `${id}-ajuda`;

  function mover(de, para) {
    const proximos = moverPara(valor, de, para);
    if (proximos !== valor) onChange(proximos);
  }

  return (
    <fieldset
      aria-describedby={[ajuda && ajudaId, erro && erroId].filter(Boolean).join(' ') || undefined}
      className="grid gap-2"
    >
      <legend className="mb-1 flex w-full items-baseline justify-between gap-2 text-sm font-medium">
        {legenda}
        {max !== undefined && (
          <span className="font-mono text-[11px] font-normal text-muted-foreground tabular-nums">
            {valor.length}/{max}
          </span>
        )}
      </legend>
      {ajuda && (
        <p className="-mt-1 text-xs text-muted-foreground" id={ajudaId}>
          {ajuda}
        </p>
      )}

      {valor.length > 0 && (
        <ListaOrdenavel ids={valor} onMover={mover} rotuloDe={rotuloDe}>
          <ol className="border border-border">
            {valor.map((ref, indice) => (
              <ItemEscolhido
                indice={indice}
                itemRef={ref}
                key={ref}
                onMover={mover}
                onRemover={() => onChange(valor.filter((atual) => atual !== ref))}
                rotulo={rotuloDe(ref)}
                total={valor.length}
              />
            ))}
          </ol>
        </ListaOrdenavel>
      )}

      <SelectSimples
        aria-label={`Adicionar a ${legenda}`}
        disabled={cheio || disponiveis.length === 0}
        onChange={(ref) => ref && onChange([...valor, ref])}
        opcoes={disponiveis}
        placeholder={cheio ? `Limite de ${max} atingido` : 'Adicionar campo'}
        value=""
      />

      {erro && (
        <p className="text-xs text-destructive" id={erroId}>
          {erro}
        </p>
      )}
    </fieldset>
  );
}
