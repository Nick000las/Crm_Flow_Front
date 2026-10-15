import { Bookmark, Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useViews } from '../hooks/use-views';
import { ExcluirViewDialog } from './excluir-view-dialog';
import { SalvarViewDialog } from './salvar-view-dialog';

const MENU_CLASS = 'w-56 rounded-none shadow-none ring-border';

/**
 * Views salvas do usuário. Aplicar substitui busca e filtro da URL;
 * excluir pede confirmação. Não há compartilhamento: são de quem salvou.
 *
 * @param {{
 *   visaoAtual: object,
 *   onAplicar: (filtros: object) => void,
 * }} props `visaoAtual` = filtro aplicado + `busca`, o que "Salvar" grava
 */
export function ViewsMenu({ visaoAtual, onAplicar }) {
  const { data: views = [], isPending, error } = useViews();
  const [salvando, setSalvando] = useState(false);
  const [viewAExcluir, setViewAExcluir] = useState(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className={cn(buttonVariants({ variant: 'outline' }), 'h-9 rounded-none')}>
          <Bookmark aria-hidden="true" />
          Views
        </DropdownMenuTrigger>
        <DropdownMenuContent className={MENU_CLASS}>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Views salvas</DropdownMenuLabel>
            {isPending && <DropdownMenuItem disabled>Carregando…</DropdownMenuItem>}
            {error && <DropdownMenuItem disabled>Não foi possível carregar</DropdownMenuItem>}
            {!isPending && !error && views.length === 0 && (
              <DropdownMenuItem disabled>Nenhuma view salva</DropdownMenuItem>
            )}
            {views.map((view) => (
              <DropdownMenuItem key={view.id} onClick={() => onAplicar(view.filtros)}>
                {view.nome}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setSalvando(true)}>
            <Save aria-hidden="true" />
            Salvar visão atual…
          </DropdownMenuItem>

          {views.length > 0 && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Trash2 aria-hidden="true" />
                Excluir view
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className={MENU_CLASS}>
                {views.map((view) => (
                  <DropdownMenuItem key={view.id} onClick={() => setViewAExcluir(view)} variant="destructive">
                    {view.nome}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SalvarViewDialog filtros={visaoAtual} onOpenChange={setSalvando} open={salvando} />
      <ExcluirViewDialog onOpenChange={(aberto) => !aberto && setViewAExcluir(null)} view={viewAExcluir} />
    </>
  );
}
