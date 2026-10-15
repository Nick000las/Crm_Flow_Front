import { Columns3 } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

/**
 * @param {{
 *   colunas: import('../lib/colunas').Coluna[],
 *   selecionadas: string[],
 *   onAlternar: (id: string) => void,
 * }} props
 */
export function SeletorColunas({ colunas, selecionadas, onAlternar }) {
  const ultimaSelecionada = selecionadas.length === 1;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'outline' }), 'h-9 rounded-none')}
      >
        <Columns3 aria-hidden="true" />
        Colunas
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-60 rounded-none shadow-none ring-border"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          {colunas.map((coluna) => {
            const marcada = selecionadas.includes(coluna.id);

            return (
              <DropdownMenuCheckboxItem
                checked={marcada}
                closeOnClick={false}
                // Desmarcar a última deixaria a tabela vazia.
                disabled={marcada && ultimaSelecionada}
                key={coluna.id}
                onCheckedChange={() => onAlternar(coluna.id)}
              >
                {coluna.label}
              </DropdownMenuCheckboxItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
