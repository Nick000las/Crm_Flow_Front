import {
  Archive,
  ArchiveRestore,
  Combine,
  MoreHorizontal,
  Pencil,
  ShieldOff,
  Trash2,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { estaArquivado } from '../lib/arquivo';

/**
 * Menu "⋯" da linha. Arquivar/Desarquivar só aparecem com os handlers
 * (`crm.arquivo`); qual dos dois depende do lead. Mesclar, só com o handler
 * (`crm.duplicidade` + DONO/MASTER). Anonimizar, só com o handler (`crm.lgpd`
 * + DONO/MASTER). Lead anonimizado não edita, não mescla e não anonimiza de novo.
 *
 * @param {{
 *   lead: import('../types').Lead,
 *   onEditar: () => void,
 *   onExcluir: () => void,
 *   onArquivar?: () => void,
 *   onDesarquivar?: () => void,
 *   onMesclar?: () => void,
 *   onAnonimizar?: () => void,
 * }} props
 */
export function AcoesLead({
  lead,
  onEditar,
  onExcluir,
  onArquivar,
  onDesarquivar,
  onMesclar,
  onAnonimizar,
}) {
  const arquivado = estaArquivado(lead);
  const anonimizado = Boolean(lead.anonimizado_em);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Ações de ${lead.nome}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'rounded-none')}
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-none shadow-none ring-border">
        {!anonimizado && (
          <DropdownMenuItem onClick={onEditar}>
            <Pencil aria-hidden="true" />
            Editar
          </DropdownMenuItem>
        )}
        {onArquivar && !arquivado && (
          <DropdownMenuItem onClick={onArquivar}>
            <Archive aria-hidden="true" />
            Arquivar
          </DropdownMenuItem>
        )}
        {onDesarquivar && arquivado && (
          <DropdownMenuItem onClick={onDesarquivar}>
            <ArchiveRestore aria-hidden="true" />
            Desarquivar
          </DropdownMenuItem>
        )}
        {onMesclar && !anonimizado && (
          <DropdownMenuItem onClick={onMesclar}>
            <Combine aria-hidden="true" />
            Mesclar…
          </DropdownMenuItem>
        )}
        {onAnonimizar && !anonimizado && (
          <DropdownMenuItem onClick={onAnonimizar}>
            <ShieldOff aria-hidden="true" />
            Anonimizar…
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={onExcluir} variant="destructive">
          <Trash2 aria-hidden="true" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
