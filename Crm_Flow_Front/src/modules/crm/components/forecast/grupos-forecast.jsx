import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AGRUPAR_FORECAST } from '../../constants';
import { rotuloCurtoDoMes } from '../../lib/forecast-textos';

const HEAD_CLASS =
  'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';

/**
 * Resumo por grupo (responsável ou status), uma linha por grupo. Sem valor, as
 * células mostram contagens e não há coluna de previsto.
 *
 * @param {{
 *   linhas: import('../../lib/forecast-vista').LinhaDeGrupo[],
 *   meses: { mes: string }[],
 *   agrupar: string,
 * }} props `meses` dá a ordem das colunas (os meses do gráfico)
 */
export function GruposForecast({ linhas, meses, agrupar }) {
  if (!linhas || linhas.length === 0) {
    return null;
  }

  const legenda = agrupar === AGRUPAR_FORECAST.STATUS ? 'Por status' : 'Por responsável';
  const comPrevisto = linhas.some((linha) => linha.previsto !== null);

  return (
    <div className="overflow-x-auto border border-border">
      <Table>
        <caption className="border-b border-border p-3 text-left text-sm font-medium">
          {legenda}
        </caption>
        <TableHeader>
          <TableRow>
            <TableHead className={HEAD_CLASS} scope="col">
              {agrupar === AGRUPAR_FORECAST.STATUS ? 'Status' : 'Responsável'}
            </TableHead>
            {comPrevisto && (
              <TableHead className={`${HEAD_CLASS} text-right`} scope="col">
                Previsto
              </TableHead>
            )}
            {meses.map((m) => (
              <TableHead className={`${HEAD_CLASS} text-right`} key={m.mes} scope="col">
                {rotuloCurtoDoMes(m.mes)}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {linhas.map((linha) => {
            const textoPorMes = new Map(linha.meses.map((m) => [m.mes, m.texto]));
            return (
              <TableRow key={linha.chave ?? 'sem-responsavel'}>
                <TableCell className="font-medium" scope="row">
                  {linha.rotulo}
                </TableCell>
                {comPrevisto && (
                  <TableCell className="text-right font-mono tabular-nums">
                    {linha.previsto ?? '—'}
                  </TableCell>
                )}
                {meses.map((m) => (
                  <TableCell className="text-right font-mono tabular-nums" key={m.mes}>
                    {textoPorMes.get(m.mes) ?? '—'}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
