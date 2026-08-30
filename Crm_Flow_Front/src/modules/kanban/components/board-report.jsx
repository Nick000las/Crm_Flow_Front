/**
 * @file Renderiza board report, na área de Kanban, expondo os estados e eventos necessários à
 * interface.
 */
import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, X } from 'lucide-react';

import { AsyncContent, MetricsSkeleton } from '@/components/loading-skeletons';
import { StatCard } from '@/components/stat-card';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { EditorDialog } from './editor-dialog';

export function BoardReport({ board, authApi, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([
      authApi.get(`/kanban/boards/${board.id}/relatorio`),
      authApi.get(`/kanban/boards/${board.id}/metricas`),
    ])
      .then((data) => {
        if (active) {
          setRows({ stages: data[0], metrics: data[1] });
          setError('');
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) {
          setRefreshing(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authApi, board.id, retry]);

  return (
    <EditorDialog onClose={onClose} className="kb-card-editor max-w-4xl">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border bg-card px-6 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground"
            aria-hidden="true"
          >
            <BarChart3 className="size-4" />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                id="kb-editor-title"
                className="text-base font-semibold tracking-tight text-foreground"
              >
                Métricas de fluxo
              </h2>
              {board?.nome && (
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {board.nome}
                </span>
              )}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Média de permanência por passagem desde o início do histórico. A etapa atual conta até
              agora.
            </p>
          </div>
        </div>

        <Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {error && (
          <div className="space-y-2.5">
            <Alert variant="destructive" role="alert">
              {error}
            </Alert>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRefreshing(true);
                setRetry((value) => value + 1);
              }}
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              Tentar novamente
            </Button>
          </div>
        )}

        <AsyncContent
          loading={!rows && !error}
          skeleton={<MetricsSkeleton label="Calculando relatório…" />}
        >
          {rows && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Cards abertos" value={rows.metrics.abertos ?? 0} />
                <StatCard label="Bloqueados" value={rows.metrics.bloqueados ?? 0} />
                <StatCard label="Concluídos (30 dias)" value={rows.metrics.concluidos30Dias ?? 0} />
                <StatCard
                  label="Tempo médio até conclusão"
                  value={`${Number(rows.metrics.tempoMedioConclusaoHoras ?? 0).toLocaleString(
                    'pt-BR',
                    {
                      maximumFractionDigits: 1,
                    },
                  )} h`}
                />
              </div>

              <p className="text-xs leading-relaxed text-muted-foreground">
                O tempo até conclusão considera a primeira conclusão registrada dos cards atualmente
                concluídos, incluindo arquivados e excluindo modelos.
              </p>

              {rows.stages.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Etapa</TableHead>
                        <TableHead className="text-right">Cards no histórico</TableHead>
                        <TableHead className="text-right">Permanência média (h)</TableHead>
                        <TableHead className="text-right">Em aberto</TableHead>
                        <TableHead className="text-right">Idade atual média (h)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.stages.map((row) => {
                        const stage = rows.metrics.etapas?.find((item) => item.id === row.id);

                        return (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium text-foreground">
                              {row.nome}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{row.cards}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {Number(row.horas).toLocaleString('pt-BR', {
                                maximumFractionDigits: 1,
                              })}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {stage?.abertos ?? 0}
                              {stage?.wipLimit ? ` / ${stage.wipLimit}` : ''}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {Number(stage?.idadeMediaHoras ?? 0).toLocaleString('pt-BR', {
                                maximumFractionDigits: 1,
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-8 text-center text-xs text-muted-foreground">
                  Ainda não há etapas para analisar neste quadro.
                </div>
              )}
            </div>
          )}
        </AsyncContent>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface/80 px-6 py-3.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={refreshing}
          loadingText="Atualizando…"
          onClick={() => {
            setRefreshing(true);
            setRetry((value) => value + 1);
          }}
        >
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Atualizar métricas
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Fechar
        </Button>
      </footer>
    </EditorDialog>
  );
}
