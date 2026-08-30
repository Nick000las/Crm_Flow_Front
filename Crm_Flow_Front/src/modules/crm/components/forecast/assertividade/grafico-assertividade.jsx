/**
 * @file Barras por mês fechado, previsto e realizado lado a lado, com a porcentagem em cima. Os
 * números são os da API; a linha invisível só marca onde fica o rótulo (o topo da barra mais
 * alta).
 */
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

import {
  AJUDA_FAIXA,
  ROTULOS_FAIXA,
  ROTULOS_SERIE_ASSERTIVIDADE,
  TEXTOS_ASSERTIVIDADE,
} from '../../../lib/assertividade-textos';

/** Cores só por tokens do tema: previsto em azul, realizado em verde. */
const COR_PREVISTO = 'var(--info)';
const COR_REALIZADO = 'var(--success)';
const COR_GRADE = 'var(--border)';
const COR_SUPERFICIE = 'var(--card)';

/**
 * Faixa no rótulo: o texto é o número, sempre; o tom só reforça. Usa as cores
 * semânticas do tema, preservando o texto como indicação principal.
 */
const COR_FAIXA = Object.freeze({
  otimista: 'var(--warning)',
  boa: 'var(--success)',
  pessimista: 'var(--info)',
});

const TICK = {
  fill: 'var(--muted-foreground)',
  fontSize: 11,
  style: { fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums' },
};

const moedaCompacta = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
});

/** Parte o selo em duas linhas para caber sobre a barra. */
function linhasDoSelo(texto) {
  const palavras = texto.split(' ');
  const meio = Math.ceil(palavras.length / 2);

  return [palavras.slice(0, meio).join(' '), palavras.slice(meio).join(' ')].filter(Boolean);
}

/**
 * Rótulo no topo de cada grupo: a porcentagem (ou o selo, sem dados). Vai como
 * ponto de uma linha invisível, centrado no mês.
 * @param {{ cx?: number, cy?: number, payload?: { ponto?: import('../../../lib/assertividade-vista').PontoAssertividade } }} props
 */
function RotuloDoMes({ cx, cy, payload }) {
  const ponto = payload?.ponto;

  if (!ponto || typeof cx !== 'number' || typeof cy !== 'number') {
    return null;
  }

  if (ponto.semDados) {
    const linhas = linhasDoSelo(TEXTOS_ASSERTIVIDADE.semDados);

    return (
      <text
        fontSize={9}
        style={{
          fill: 'var(--muted-foreground)',
          fontFamily: 'var(--font-sans)',
          fontVariantNumeric: 'tabular-nums',
        }}
        textAnchor="middle"
        x={cx}
        y={cy - 6 - (linhas.length - 1) * 10}
      >
        {linhas.map((linha, i) => (
          <tspan dy={i === 0 ? 0 : 10} key={linha} x={cx}>
            {linha}
          </tspan>
        ))}
      </text>
    );
  }

  return (
    <text
      fontSize={12}
      fontWeight={600}
      style={{
        fill: ponto.faixa ? COR_FAIXA[ponto.faixa] : 'var(--muted-foreground)',
        fontFamily: 'var(--font-sans)',
        fontVariantNumeric: 'tabular-nums',
      }}
      textAnchor="middle"
      x={cx}
      y={cy - 6}
    >
      {ponto.rotuloPct}
    </text>
  );
}

function DicaDoGrafico({ active, payload }) {
  const ponto = active ? payload?.[0]?.payload?.ponto : null;

  if (!ponto) {
    return null;
  }

  return (
    <div className="grid min-w-48 gap-1.5 rounded-xl border border-border bg-popover p-3 shadow-lg text-xs text-popover-foreground">
      <p className="font-medium">{ponto.rotuloLongo}</p>
      <dl className="grid gap-1">
        {ponto.tooltip.map((linha) => (
          <div className="flex justify-between gap-4" key={linha.rotulo}>
            <dt className="text-muted-foreground">{linha.rotulo}</dt>
            <dd className="tabular-nums">{linha.texto}</dd>
          </div>
        ))}
        {ponto.rotuloFaixa && (
          <div className="flex justify-between gap-4 border-t border-border pt-1">
            <dt className="text-muted-foreground">Leitura</dt>
            <dd>{ponto.rotuloFaixa}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function Legenda() {
  const item = 'flex items-center gap-1.5';

  return (
    <div className="grid gap-1.5 text-xs text-muted-foreground">
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <li className={item}>
          <span aria-hidden="true" className="size-2.5" style={{ background: COR_PREVISTO }} />
          {ROTULOS_SERIE_ASSERTIVIDADE.previsto}
        </li>
        <li className={item}>
          <span aria-hidden="true" className="size-2.5" style={{ background: COR_REALIZADO }} />
          {ROTULOS_SERIE_ASSERTIVIDADE.realizado}
        </li>
      </ul>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {Object.keys(COR_FAIXA).map((faixa) => (
          <li className={item} key={faixa}>
            <span
              aria-hidden="true"
              className="size-2.5 border border-border"
              style={{ background: COR_FAIXA[faixa] }}
            />
            <span>
              <span className="font-medium">{ROTULOS_FAIXA[faixa]}:</span> {AJUDA_FAIXA[faixa]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Barras por mês fechado, previsto e realizado lado a lado, com a porcentagem
 * em cima. Os números são os da API; a linha invisível só marca onde fica o
 * rótulo (o topo da barra mais alta).
 *
 * @param {{
 *   pontos: import('../../../lib/assertividade-vista').PontoAssertividade[],
 *   mesAberto: string | null,
 *   onAbrirMes: (mes: string) => void,
 * }} props
 */
export function GraficoAssertividade({ pontos, mesAberto, onAbrirMes }) {
  const dados = useMemo(
    () =>
      pontos.map((ponto) => ({
        mes: ponto.mes,
        previsto: ponto.previsto,
        realizado: ponto.realizado,
        topo: ponto.previsto === null ? ponto.realizado : Math.max(ponto.previsto, ponto.realizado),
        ponto,
      })),
    [pontos],
  );

  const primeiro = pontos[0]?.rotuloLongo ?? '';
  const ultimo = pontos[pontos.length - 1]?.rotuloLongo ?? '';
  const resumo = `Gráfico de barras com o previsto e o realizado em reais por mês, de ${primeiro} a ${ultimo}, com a assertividade em porcentagem sobre cada mês. Use os botões abaixo para abrir o mês por responsável.`;

  const abrir = (dado) => {
    const mes = dado?.mes ?? dado?.payload?.mes;

    if (mes) {
      onAbrirMes(mes);
    }
  };

  return (
    <div data-tour="crm-forecast-chart" className="grid gap-3">
      <div aria-label={resumo} className="h-80 w-full" role="img">
        <ResponsiveContainer height="100%" width="100%">
          <ComposedChart
            barCategoryGap="22%"
            barGap={2}
            data={dados}
            margin={{ top: 36, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid stroke={COR_GRADE} strokeDasharray="0" vertical={false} />
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
              tickFormatter={(valor) => moedaCompacta.format(valor)}
              tickLine={false}
              width={64}
            />
            <Tooltip content={<DicaDoGrafico />} cursor={false} isAnimationActive={false} />
            <Bar
              cursor="pointer"
              dataKey="previsto"
              fill={COR_PREVISTO}
              isAnimationActive={false}
              maxBarSize={28}
              onClick={abrir}
              stroke={COR_SUPERFICIE}
              strokeWidth={1}
            />
            <Bar
              cursor="pointer"
              dataKey="realizado"
              fill={COR_REALIZADO}
              isAnimationActive={false}
              maxBarSize={28}
              onClick={abrir}
              stroke={COR_SUPERFICIE}
              strokeWidth={1}
            />
            <Line
              activeDot={false}
              dataKey="topo"
              dot={<RotuloDoMes />}
              isAnimationActive={false}
              legendType="none"
              stroke="none"
              tooltipType="none"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <Legenda />

      <div aria-label="Meses da assertividade" className="flex flex-wrap gap-1.5" role="group">
        {pontos.map((ponto) => {
          const aberto = ponto.mes === mesAberto;
          const resumoDoMes = ponto.semDados ? TEXTOS_ASSERTIVIDADE.semDados : ponto.rotuloPct;

          return (
            <button
              aria-label={`${ponto.rotuloLongo}: ${resumoDoMes}`}
              aria-pressed={aberto}
              className={cn(
                'flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-xs font-medium tabular-nums outline-none transition-colors duration-150',
                'focus-visible:ring-2 focus-visible:ring-ring/50',
                aberto
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card hover:border-border-strong hover:bg-accent',
              )}
              key={ponto.mes}
              onClick={() => onAbrirMes(ponto.mes)}
              type="button"
            >
              <span>{ponto.rotulo}</span>
              <span aria-hidden="true" className={aberto ? undefined : 'text-muted-foreground'}>
                {resumoDoMes}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
