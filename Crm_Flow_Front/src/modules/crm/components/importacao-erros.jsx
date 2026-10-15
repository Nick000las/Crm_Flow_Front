import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { salvarCsv } from '@/lib/download';
import { relatorioCsv } from '../lib/importacao';

const HEAD_CLASS = 'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
// A tela mostra as primeiras; o CSV leva todas.
const MAX_LINHAS_NA_TELA = 100;

/**
 * Erros por linha da planilha, com download do relatório completo em CSV
 * (gerado no cliente).
 *
 * @param {{
 *   erros: { linha: number, coluna?: string, motivo: string }[],
 *   nomeRelatorio: string,
 *   titulo: string,
 * }} props
 */
export function ImportacaoErros({ erros, nomeRelatorio, titulo }) {
  if (erros.length === 0) return null;

  const visiveis = erros.slice(0, MAX_LINHAS_NA_TELA);

  return (
    <section className="grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">
          {titulo} <span className="font-mono text-muted-foreground tabular-nums">({erros.length})</span>
        </h2>
        <Button onClick={() => salvarCsv(relatorioCsv(erros), nomeRelatorio)} size="sm" variant="outline">
          <Download aria-hidden="true" />
          Baixar relatório (CSV)
        </Button>
      </div>

      <div className="max-h-80 overflow-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={HEAD_CLASS} scope="col">Linha</TableHead>
              <TableHead className={HEAD_CLASS} scope="col">Coluna</TableHead>
              <TableHead className={HEAD_CLASS} scope="col">Motivo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiveis.map((erro, indice) => (
              <TableRow key={`${erro.linha}-${erro.coluna ?? ''}-${indice}`}>
                <TableCell className="font-mono text-xs tabular-nums">{erro.linha}</TableCell>
                <TableCell className="text-muted-foreground">{erro.coluna ?? '—'}</TableCell>
                <TableCell className="whitespace-normal">{erro.motivo}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {erros.length > visiveis.length && (
        <p className="text-xs text-muted-foreground">
          Mostrando {visiveis.length} de {erros.length}. O relatório CSV tem todos.
        </p>
      )}
    </section>
  );
}
