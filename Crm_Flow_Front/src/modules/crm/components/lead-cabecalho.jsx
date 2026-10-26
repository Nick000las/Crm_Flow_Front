import { Archive, ArchiveRestore, MoreHorizontal, Pencil, Shuffle, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { estaArquivado } from '../lib/arquivo';
import { lerValorDaColuna } from '../lib/colunas';
import { colunaDoItem, subtituloDoLead, tituloDoLead } from '../lib/layout';
import { CelulaLead } from './celula-lead';
import { SeloEsfriando } from './selo-esfriando';

const DESCRICAO = Object.freeze({
  CRIANDO: 'Preencha os dados do contato.',
  EDITANDO: 'Editando o lead.',
  VENDO: 'Dados do lead.',
});

/** Chips de destaque: rótulo pequeno + valor, no mesmo formato da tabela. */
function Destaques({ lead, itens, nomePorId }) {
  if (itens.length === 0) return null;

  return (
    <dl className="flex flex-wrap gap-2 pt-1">
      {itens.map((item) => {
        const coluna = colunaDoItem(item);

        return (
          <div className="grid gap-0.5 border border-border px-2 py-1" key={item.ref}>
            <dt className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">{item.label}</dt>
            <dd className="text-sm">
              <CelulaLead coluna={coluna} nomePorId={nomePorId} valor={lerValorDaColuna(lead, coluna)} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Ações do lead aberto. Com `crm.arquivo`, Arquivar/Desarquivar é o destaque
 * e Excluir (lixeira) vai para o "⋯"; sem a flag, Excluir em vermelho.
 */
function AcoesDoLead({ arquivo, onEditar, onExcluir }) {
  const editar = (
    <Button onClick={onEditar} size="sm" variant="outline">
      <Pencil aria-hidden="true" />
      Editar
    </Button>
  );

  if (!arquivo) {
    return (
      <div className="flex gap-2 pt-2">
        {editar}
        <Button onClick={onExcluir} size="sm" variant="destructive">
          <Trash2 aria-hidden="true" />
          Excluir
        </Button>
      </div>
    );
  }

  const { arquivado, ocupado, onArquivar, onDesarquivar } = arquivo;

  return (
    <div className="flex gap-2 pt-2">
      {editar}
      <Button
        aria-busy={ocupado}
        disabled={ocupado}
        onClick={arquivado ? onDesarquivar : onArquivar}
        size="sm"
        variant="outline"
      >
        {arquivado ? <ArchiveRestore aria-hidden="true" /> : <Archive aria-hidden="true" />}
        {arquivado ? 'Desarquivar' : 'Arquivar'}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Mais ações do lead"
          className={cn(buttonVariants({ variant: 'outline', size: 'icon-sm' }), 'rounded-none')}
        >
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40 rounded-none shadow-none ring-border">
          <DropdownMenuItem onClick={onExcluir} variant="destructive">
            <Trash2 aria-hidden="true" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/**
 * Cabeçalho do Sheet do lead. Com layout (`crm.layout`): título pelo
 * identificador (com fallback para o Nome), subtítulo " · " e destaques.
 * Sem layout: o nome e uma frase do modo. `arquivo` (`crm.arquivo`) traz o
 * selo "Arquivado" e as ações de arquivo.
 *
 * @param {{
 *   criando: boolean,
 *   editando: boolean,
 *   lead: import('../types').Lead | undefined,
 *   layout: import('../lib/layout').LayoutEfetivo | null,
 *   nomePorId: Map<string, string>,
 *   onEditar: () => void,
 *   onExcluir: () => void,
 *   arquivo?: { ocupado: boolean, onArquivar: () => void, onDesarquivar: () => void } | null,
 * }} props
 */
export function LeadCabecalho({ criando, editando, lead, layout, nomePorId, onEditar, onExcluir, arquivo = null }) {
  const titulo = criando ? 'Novo lead' : lead ? tituloDoLead(lead, layout?.identificador) : 'Lead';
  const subtitulo = lead && layout && !criando ? subtituloDoLead(lead, layout.subtitulo, nomePorId) : '';
  const modo = criando ? DESCRICAO.CRIANDO : editando ? DESCRICAO.EDITANDO : DESCRICAO.VENDO;
  const arquivado = Boolean(arquivo) && !criando && estaArquivado(lead);

  return (
    <SheetHeader className="border-b border-border p-4">
      <div className="flex flex-wrap items-center gap-2 pr-8">
        <SheetTitle>{titulo}</SheetTitle>
        {arquivado && (
          <Badge className="rounded-none" variant="outline">
            <Archive aria-hidden="true" />
            Arquivado
          </Badge>
        )}
        {!criando && <SeloEsfriando esfriandoDesde={lead?.esfriando_desde} />}
      </div>
      {/* Com subtítulo, ele descreve o lead; a frase do modo vira só leitor de tela. */}
      <SheetDescription>
        {subtitulo || modo}
        {subtitulo && <span className="sr-only">. {modo}</span>}
      </SheetDescription>
      {/* M12: a regra de distribuição que escolheu o responsável. */}
      {!criando && lead?.atribuido_por_regra_nome && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Shuffle aria-hidden="true" className="size-3.5" />
          Atribuído pela regra <span className="font-medium text-foreground">{lead.atribuido_por_regra_nome}</span>
        </p>
      )}

      {lead && layout && !criando && !editando && (
        <Destaques itens={layout.destaques} lead={lead} nomePorId={nomePorId} />
      )}

      {!criando && lead && !editando && (
        <AcoesDoLead arquivo={arquivo && { ...arquivo, arquivado }} onEditar={onEditar} onExcluir={onExcluir} />
      )}
    </SheetHeader>
  );
}
