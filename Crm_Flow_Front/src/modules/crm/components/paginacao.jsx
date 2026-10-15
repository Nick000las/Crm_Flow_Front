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
 * }} props
 */
export function Paginacao({ pagina, tamanho, total, onChange }) {
  const ultima = totalDePaginas(total, tamanho);

  return (
    <nav
      aria-label="Paginação"
      className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-xs text-muted-foreground"
    >
      <div className="flex items-center gap-2">
        <Button
          aria-label="Página anterior"
          className="rounded-none"
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
          className="rounded-none"
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
          <SelectTrigger aria-label="Leads por página" className="h-8 w-20 rounded-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAMANHOS_PAGINA.map((opcao) => (
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
