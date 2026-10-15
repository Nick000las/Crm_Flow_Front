import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * Menu "⋯" da linha.
 *
 * @param {{
 *   lead: { nome: string },
 *   onEditar: () => void,
 *   onExcluir: () => void,
 * }} props
 */
export function AcoesLead({ lead, onEditar, onExcluir }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Ações de ${lead.nome}`}
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }), 'rounded-none')}
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-none shadow-none ring-border">
        <DropdownMenuItem onClick={onEditar}>
          <Pencil aria-hidden="true" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExcluir} variant="destructive">
          <Trash2 aria-hidden="true" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
