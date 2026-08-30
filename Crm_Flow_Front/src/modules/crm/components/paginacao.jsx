/**
 * @file Renderiza paginacao, na área de CRM, expondo os estados e eventos necessários à
 * interface.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { TAMANHOS_PAGINA } from '../constants';
import { totalDePaginas } from '../lib/url-state';

/**
 * @param {{
 *   pagina: number,
 *   tamanho: number,
 *   total: number,
 *   onChange: (mudancas: { pagina?: number, tamanho?: number }) => void,
 *   tamanhos?: readonly number[],
 *   rotuloTamanho?: string,
 * }} props `tamanhos` e `rotuloTamanho` trocam as opções e o nome acessível do seletor
 */
export function Paginacao({
  pagina,
  tamanho,
  total,
  onChange,
  tamanhos = TAMANHOS_PAGINA,
  rotuloTamanho = 'Leads por página',
}) {
  const ultima = totalDePaginas(total, tamanho);

  return (
    <nav
      aria-label="Paginação"
      className="theme-pagination mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground"
    >
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          disabled={pagina <= 1}
          onClick={() => onChange({ pagina: pagina - 1 })}
          size="icon"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" />
        </Button>
        <span aria-current="page" className="tabular-nums">
          {pagina} / {ultima}
        </span>
        <Button
          aria-label="Próxima página"
          disabled={pagina >= ultima}
          onClick={() => onChange({ pagina: pagina + 1 })}
          size="icon"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span aria-hidden="true">Por página</span>
        <Select
          onValueChange={(valor) => onChange({ tamanho: Number(valor), pagina: 1 })}
          value={String(tamanho)}
        >
          <SelectTrigger size="sm" aria-label={rotuloTamanho} className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tamanhos.map((opcao) => (
              <SelectItem key={opcao} value={String(opcao)}>
                {opcao}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </nav>
  );
}
