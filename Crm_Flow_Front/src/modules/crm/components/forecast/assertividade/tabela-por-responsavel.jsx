/**
 * @file Assertividade por responsável do mês aberto. "Sem responsável" e "Responsável removido"
 * são linhas comuns, sem link.
 */
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { COLUNAS_RESPONSAVEL, TEXTOS_ASSERTIVIDADE } from '../../../lib/assertividade-textos';

/**
 * Assertividade por responsável do mês aberto. "Sem responsável" e
 * "Responsável removido" são linhas comuns, sem link.
 *
 * @param {{
 *   titulo: string,
 *   linhas: import('../../../lib/assertividade-vista').LinhaResponsavel[],
 * }} props
 */
export function TabelaPorResponsavel({ titulo, linhas }) {
  const vazia = !linhas || linhas.length === 0;

  return (
    <Card layout="plain" className="overflow-x-auto">
      <Table>
        <caption className="border-b border-border p-3 text-left text-sm font-medium">
          {titulo}
        </caption>
        {vazia ? (
          <TableBody>
            <TableRow>
              <TableCell className="p-4 text-sm text-muted-foreground">
                {TEXTOS_ASSERTIVIDADE.semResponsaveis}
              </TableCell>
            </TableRow>
          </TableBody>
        ) : (
          <>
            <TableHeader>
              <TableRow>
                <TableHead scope="col">{COLUNAS_RESPONSAVEL.responsavel}</TableHead>
                <TableHead className="text-right" scope="col">
                  {COLUNAS_RESPONSAVEL.previsto}
                </TableHead>
                <TableHead className="text-right" scope="col">
                  {COLUNAS_RESPONSAVEL.realizado}
                </TableHead>
                <TableHead className="text-right" scope="col">
                  {COLUNAS_RESPONSAVEL.assertividade}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((linha) => (
                <TableRow key={linha.chave}>
                  <TableCell className="font-medium" scope="row">
                    {linha.rotulo}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{linha.previsto}</TableCell>
                  <TableCell className="text-right tabular-nums">{linha.realizado}</TableCell>
                  <TableCell className="text-right">
                    <span className="tabular-nums">{linha.pct}</span>
                    {linha.rotuloFaixa && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {linha.rotuloFaixa}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </>
        )}
      </Table>
    </Card>
  );
}
