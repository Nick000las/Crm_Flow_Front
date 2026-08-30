/**
 * @file Lista de oportunidades por trás de um número. Valores à direita, em mono; `null` vira
 * "—".
 */
import { Link } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

import { celulaDaLista } from '../../lib/forecast-vista';

/**
 * @typedef {{
 *   ids: Set<string>,
 *   cheia: boolean,
 *   alternar: (item: object) => void,
 *   alternarPagina: (itens: object[]) => void,
 * }} SelecaoDoForecast  mesma forma de `useSelecaoLeads(...).tabela`
 */

function SelecionarPagina({ selecao, itens }) {
  const marcados = itens.filter((item) => selecao.ids.has(item.id)).length;
  const todos = itens.length > 0 && marcados === itens.length;

  return (
    <Checkbox
      aria-label="Selecionar esta página"
      checked={todos}
      disabled={!todos && selecao.cheia}
      indeterminate={marcados > 0 && !todos}
      onCheckedChange={() => selecao.alternarPagina(itens)}
    />
  );
}

/**
 * Lista de oportunidades por trás de um número. Valores à direita, em mono;
 * `null` vira "—".
 *
 * @param {{
 *   itens: object[],
 *   colunas: import('../../lib/forecast-vista').ColunaForecast[],
 *   nomePorId: Map<string, string>,
 *   linkDoLead: (item: object) => string,
 *   selecao?: SelecaoDoForecast | null,
 * }} props
 */
export function TabelaForecast({ itens, colunas, nomePorId, linkDoLead, selecao = null }) {
  return (
    <Card layout="plain" className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {selecao && (
              <TableHead className="w-10" scope="col">
                <SelecionarPagina itens={itens} selecao={selecao} />
              </TableHead>
            )}
            {colunas.map((coluna) => (
              <TableHead
                className={cn(coluna.numerica && 'text-right')}
                key={coluna.id}
                scope="col"
              >
                {coluna.rotulo}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {itens.map((item) => {
            const marcado = selecao?.ids.has(item.id) ?? false;

            return (
              <TableRow data-state={marcado ? 'selected' : undefined} key={item.id}>
                {selecao && (
                  <TableCell data-selecao>
                    <Checkbox
                      aria-label={`Selecionar ${item.pessoa}`}
                      checked={marcado}
                      disabled={!marcado && selecao.cheia}
                      onCheckedChange={() => selecao.alternar(item)}
                    />
                  </TableCell>
                )}
                {colunas.map((coluna) => {
                  const texto = celulaDaLista(item, coluna, nomePorId);

                  return (
                    <TableCell
                      className={cn(coluna.numerica && 'text-right tabular-nums')}
                      key={coluna.id}
                    >
                      {coluna.id === 'pessoa' ? (
                        <Link
                          className="underline-offset-4 outline-none hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring/50"
                          to={linkDoLead(item)}
                        >
                          {texto ?? '—'}
                        </Link>
                      ) : (
                        (texto ?? '—')
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
