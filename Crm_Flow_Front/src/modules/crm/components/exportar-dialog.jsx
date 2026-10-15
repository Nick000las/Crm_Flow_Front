import { ArrowDown, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { EXPORTACAO } from '../constants';
import { useExportarLeads } from '../hooks/use-exportacao';
import { alternarItem, colunasSelecionadas, itensIniciais, moverItem } from '../lib/colunas-export';
import { contarFiltros, paraCorpoDeBusca } from '../lib/filtro';

const SUBIR = -1;
const DESCER = 1;

function ListaDeColunas({ itens, onAlternar, onMover }) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-sm font-medium">Colunas, na ordem da planilha</legend>
      <ol className="max-h-72 divide-y divide-border overflow-y-auto border border-border">
        {itens.map((item, indice) => {
          const id = `exportar-${item.chave}`;

          return (
            <li className="flex items-center gap-2 px-2 py-1.5" key={item.chave}>
              <Checkbox checked={item.marcada} id={id} onCheckedChange={() => onAlternar(item.chave)} />
              <label className="flex-1 text-sm" htmlFor={id}>
                {item.label}
              </label>
              <Button
                aria-label={`Subir ${item.label}`}
                className="rounded-none"
                disabled={indice === 0}
                onClick={() => onMover(indice, SUBIR)}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <ArrowUp aria-hidden="true" />
              </Button>
              <Button
                aria-label={`Descer ${item.label}`}
                className="rounded-none"
                disabled={indice === itens.length - 1}
                onClick={() => onMover(indice, DESCER)}
                size="icon-xs"
                type="button"
                variant="ghost"
              >
                <ArrowDown aria-hidden="true" />
              </Button>
            </li>
          );
        })}
      </ol>
    </fieldset>
  );
}

/** Conteúdo do dialog. Montado a cada abertura: começa das colunas da tabela. */
function FormExportar({ campos, idsVisiveis, busca, filtro, onExportado }) {
  const [itens, setItens] = useState(() => itensIniciais(campos, idsVisiveis));
  const [usarFiltros, setUsarFiltros] = useState(true);
  const exportar = useExportarLeads();
  const colunas = colunasSelecionadas(itens);
  const totalFiltros = contarFiltros(filtro) + (busca ? 1 : 0);

  function handleExportar() {
    const filtroDoPedido = usarFiltros ? { ...(busca && { busca }), ...paraCorpoDeBusca(filtro) } : undefined;
    exportar.mutate({ colunas, filtro: filtroDoPedido }, { onSuccess: onExportado });
  }

  return (
    <div className="grid gap-4">
      <ListaDeColunas
        itens={itens}
        onAlternar={(chave) => setItens((atuais) => alternarItem(atuais, chave))}
        onMover={(indice, direcao) => setItens((atuais) => moverItem(atuais, indice, direcao))}
      />

      <label className="flex items-center gap-2 text-sm" htmlFor="exportar-usar-filtros">
        <Switch checked={usarFiltros} id="exportar-usar-filtros" onCheckedChange={setUsarFiltros} />
        Usar a busca e os filtros atuais
        <span className="font-mono text-xs text-muted-foreground tabular-nums">({totalFiltros})</span>
      </label>
      <p className="-mt-2 text-xs text-muted-foreground">
        Até {EXPORTACAO.MAX_LINHAS.toLocaleString('pt-BR')} leads por planilha.
      </p>

      <ApiErrorAlert error={exportar.error} id="exportar-erro" title="Não foi possível exportar" />

      <DialogFooter>
        <DialogClose render={<Button disabled={exportar.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={exportar.isPending} disabled={colunas.length === 0 || exportar.isPending} onClick={handleExportar}>
          {exportar.isPending ? 'Gerando planilha…' : 'Exportar .xlsx'}
        </Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Export de leads (DONO/MASTER). Padrão: as colunas visíveis da tabela e os
 * filtros aplicados — exporta o que se está vendo.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   campos: { chave: string, label: string }[],
 *   idsVisiveis: string[],
 *   busca: string,
 *   filtro: import('../lib/filtro').FiltroAplicado,
 * }} props
 */
export function ExportarDialog({ open, onOpenChange, ...form }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar leads</DialogTitle>
          <DialogDescription>Gera uma planilha .xlsx com as colunas escolhidas.</DialogDescription>
        </DialogHeader>
        {open && <FormExportar {...form} onExportado={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
