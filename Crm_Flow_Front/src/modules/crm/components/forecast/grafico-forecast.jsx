import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

/** Cores só por tokens do tema: valem nos dois temas (grafite sobre a superfície). */
const COR_REALIZADO = 'var(--foreground)';
const COR_EM_ABERTO = 'var(--muted-foreground)';
const COR_GRADE = 'var(--border)';
const COR_SUPERFICIE = 'var(--card)';

const TICK = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
  style: { fontFamily: 'var(--font-mono)' },
};

const moedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/**
 * Traço do melhor caso, centrado na barra. Sem valor (`null`), nada.
 * @param {{ cx?: number, cy?: number, value?: number | null }} props
 */
function MarcadorMelhorCaso({ cx, cy, value }) {
  if (value === null || value === undefined || typeof cx !== 'number' || typeof cy !== 'number') {
    return null;
  }
  return (
    <line
      stroke={COR_REALIZADO}
      strokeLinecap="butt"
      strokeWidth={2}
      x1={cx - 9}
      x2={cx + 9}
      y1={cy}
      y2={cy}
    />
  );
}

function DicaDoGrafico({ active, payload }) {
  const ponto = active ? payload?.[0]?.payload?.ponto : null;
  if (!ponto) {
    return null;
  }
  return (
    <div className="grid min-w-44 gap-1.5 border border-border bg-popover p-3 text-xs text-popover-foreground">
      <p className="flex items-center justify-between gap-3 font-medium">
        <span>{ponto.rotuloLongo}</span>
        {ponto.atual && <span className="font-mono text-[10px] uppercase">Mês atual</span>}
      </p>
      <dl className="grid gap-1">
        {ponto.tooltip.map((linha) => (
          <div className="flex justify-between gap-4" key={linha.rotulo}>
            <dt className="text-muted-foreground">{linha.rotulo}</dt>
            <dd className="font-mono tabular-nums">{linha.texto}</dd>
          </div>
        ))}
      </dl>
      {ponto.avisoSemValor && <p className="text-muted-foreground">{ponto.avisoSemValor}</p>}
    </div>
  );
}

function Legenda({ modo }) {
  const item = 'flex items-center gap-1.5';
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <li className={item}>
        <span aria-hidden="true" className="size-2.5" style={{ background: COR_REALIZADO }} />
        Realizado
      </li>
      <li className={item}>
        <span aria-hidden="true" className="size-2.5" style={{ background: COR_EM_ABERTO }} />
        {modo === 'valor' ? 'Ponderado' : 'Em aberto'}
      </li>
      {modo === 'valor' && (
        <li className={item}>
          <span aria-hidden="true" className="h-0.5 w-3.5" style={{ background: COR_REALIZADO }} />
          Melhor caso
        </li>
      )}
      <li className={item}>
        <span aria-hidden="true" className="size-2.5 border border-border bg-muted" />
        Mês atual
      </li>
    </ul>
  );
}

/**
 * Barras por mês: realizado e ponderado (ou em aberto, na contagem) empilhados,
 * melhor caso como traço sobre a barra. Os números são os da API; o traço fica
 * em realizado + melhor caso (a mesma base empilhada).
 *
 * @param {{
 *   serie: { modo: 'valor' | 'contagem', pontos: import('../../lib/forecast-vista').PontoDoGrafico[] },
 *   mesAberto: string | null,
 *   onAbrirMes: (mes: string) => void,
 * }} props
 */
export function GraficoForecast({ serie, mesAberto, onAbrirMes }) {
  const { modo, pontos } = serie;
  const emValor = modo === 'valor';

  const dados = useMemo(
    () =>
      pontos.map((ponto) => ({
        mes: ponto.mes,
        rotulo: ponto.rotulo,
        realizado: ponto.realizado,
        emAberto: ponto.emAberto,
        marcador:
          emValor && ponto.melhorCaso !== null && ponto.realizado !== null
            ? ponto.realizado + ponto.melhorCaso
            : null,
        ponto,
      })),
    [pontos, emValor],
  );

  const primeiro = pontos[0]?.rotuloLongo ?? '';
  const ultimo = pontos[pontos.length - 1]?.rotuloLongo ?? '';
  const resumo = `Gráfico de barras de ${
    emValor ? 'valor em reais' : 'oportunidades'
  } por mês, de ${primeiro} a ${ultimo}. Use os botões abaixo para abrir a lista de cada mês.`;

  const formatarEixo = (valor) => (emValor ? moedaCompacta.format(valor) : inteiro.format(valor));

  const abrir = (dado) => {
    const mes = dado?.mes ?? dado?.payload?.mes;
    if (mes) {
      onAbrirMes(mes);
    }
  };

  const atual = pontos.find((ponto) => ponto.atual);

  return (
    <div className="grid gap-3">
      <div aria-label={resumo} className="h-72 w-full" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart data={dados} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={COR_GRADE} strokeDasharray="0" vertical={false} />
            {atual && (
              <ReferenceArea
                fill="var(--muted)"
                fillOpacity={1}
                ifOverflow="visible"
                x1={atual.mes}
                x2={atual.mes}
              />
            )}
            {mesAberto && (
              <ReferenceArea
                fill="none"
                ifOverflow="visible"
                stroke="var(--foreground)"
                strokeWidth={1}
                x1={mesAberto}
                x2={mesAberto}
              />
            )}
            <XAxis
              axisLine={{ stroke: COR_GRADE }}
              dataKey="mes"
              tick={TICK}
              tickFormatter={(mes) => pontos.find((p) => p.mes === mes)?.rotulo ?? mes}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              axisLine={false}
              tick={TICK}
              tickFormatter={formatarEixo}
              tickLine={false}
              width={emValor ? 64 : 36}
            />
            <Tooltip content={<DicaDoGrafico />} cursor={false} isAnimationActive={false} />
            <Bar
              cursor="pointer"
              dataKey="realizado"
              fill={COR_REALIZADO}
              isAnimationActive={false}
              maxBarSize={36}
              onClick={abrir}
              stackId="a"
              stroke={COR_SUPERFICIE}
              strokeWidth={1}
            />
            <Bar
              cursor="pointer"
              dataKey="emAberto"
              fill={COR_EM_ABERTO}
              isAnimationActive={false}
              maxBarSize={36}
              onClick={abrir}
              stackId="a"
              stroke={COR_SUPERFICIE}
              strokeWidth={1}
            />
            {emValor && (
              <Line
                activeDot={false}
                dataKey="marcador"
                dot={<MarcadorMelhorCaso />}
                isAnimationActive={false}
                legendType="none"
                stroke="none"
                tooltipType="none"
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <Legenda modo={modo} />

      <div aria-label="Meses do forecast" className="flex flex-wrap gap-1.5" role="group">
        {pontos.map((ponto) => {
          const aberto = ponto.mes === mesAberto;
          return (
            <button
              aria-current={ponto.atual ? 'date' : undefined}
              aria-label={`${ponto.rotuloLongo}${ponto.atual ? ' (mês atual)' : ''}`}
              aria-pressed={aberto}
              className={cn(
                'h-8 border px-2.5 font-mono text-xs tabular-nums outline-none transition-colors duration-200',
                'focus-visible:ring-2 focus-visible:ring-ring/50',
                aberto
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border hover:bg-muted',
                ponto.atual && !aberto && 'bg-muted',
              )}
              key={ponto.mes}
              onClick={() => onAbrirMes(ponto.mes)}
              type="button"
            >
              {ponto.rotulo}
              {ponto.atual && <span aria-hidden="true"> ·</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
