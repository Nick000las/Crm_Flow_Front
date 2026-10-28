import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SCORE } from '../../constants';
import { BotaoIcone } from '../botao-icone';

const HEAD_CLASS = 'font-mono text-[11px] font-normal uppercase tracking-wide text-muted-foreground';
const INPUT_CLASS = 'h-9 rounded-none';
const NUMERO_CLASS = 'h-9 w-24 rounded-none font-mono tabular-nums';
// Valor do seletor de cor quando o hex digitado ainda não é válido (ele não aceita outro formato).
const COR_DO_SELETOR = '#6b7280';
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** As mensagens de uma faixa, numa linha só (o 400 aponta campo ou a faixa inteira). */
function ErrosDaFaixa({ id, erros }) {
  const mensagens = [...new Set(Object.values(erros ?? {}))];
  if (mensagens.length === 0) return null;

  return (
    <p className="mt-1 text-xs text-destructive" id={id}>
      {mensagens.join(' · ')}
    </p>
  );
}

/**
 * Faixas do score editadas na própria tabela (no rascunho): rótulo, limites
 * inclusivos (vazio = sem limite) e cor. A chave da faixa salva não aparece
 * nem muda — é ela que views e filtros guardam.
 *
 * @param {{
 *   faixas: import('../../lib/score').FaixaNoForm[],
 *   erros: Record<string, Record<string, string>>,
 *   ocupado: boolean,
 *   podeEditar: boolean,
 *   onAlterar: (chaveLocal: string, parcial: Partial<import('../../lib/score').FaixaNoForm>) => void,
 *   onRemover: (chaveLocal: string) => void,
 *   onAdicionar: () => void,
 * }} props
 */
export function TabelaFaixas({ faixas, erros, ocupado, podeEditar, onAlterar, onRemover, onAdicionar }) {
  const travado = ocupado || !podeEditar;

  return (
    <div className="grid gap-2">
      <div className="overflow-x-auto border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={HEAD_CLASS} scope="col">
                Faixa
              </TableHead>
              <TableHead className={HEAD_CLASS} scope="col">
                De
              </TableHead>
              <TableHead className={HEAD_CLASS} scope="col">
                Até
              </TableHead>
              <TableHead className={HEAD_CLASS} scope="col">
                Cor
              </TableHead>
              {podeEditar && (
                <TableHead scope="col">
                  <span className="sr-only">Ações</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {faixas.map((faixa, indice) => {
              const id = `score-faixa-${faixa.chaveLocal}`;
              const erroId = `${id}-erro`;
              const daFaixa = erros[faixa.chaveLocal];
              const nome = faixa.rotulo || `Faixa ${indice + 1}`;
              const comum = (campo) => ({
                'aria-describedby': daFaixa ? erroId : undefined,
                'aria-invalid': daFaixa?.[campo] || daFaixa?.item ? true : undefined,
                disabled: travado,
              });

              return (
                <TableRow key={faixa.chaveLocal}>
                  <TableCell className="min-w-40 align-top">
                    <Input
                      {...comum('rotulo')}
                      aria-label={`Nome da faixa ${indice + 1}`}
                      className={INPUT_CLASS}
                      onChange={(event) => onAlterar(faixa.chaveLocal, { rotulo: event.target.value })}
                      value={faixa.rotulo}
                    />
                    <ErrosDaFaixa erros={daFaixa} id={erroId} />
                  </TableCell>
                  <TableCell className="align-top">
                    <Input
                      {...comum('minimo')}
                      aria-label={`${nome}: de (vazio = sem limite)`}
                      className={NUMERO_CLASS}
                      inputMode="numeric"
                      onChange={(event) => onAlterar(faixa.chaveLocal, { minimo: event.target.value })}
                      placeholder="sem limite"
                      value={faixa.minimo}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <Input
                      {...comum('maximo')}
                      aria-label={`${nome}: até (vazio = sem limite)`}
                      className={NUMERO_CLASS}
                      inputMode="numeric"
                      onChange={(event) => onAlterar(faixa.chaveLocal, { maximo: event.target.value })}
                      placeholder="sem limite"
                      value={faixa.maximo}
                    />
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex items-center gap-2">
                      <input
                        aria-label={`${nome}: escolher cor`}
                        className="size-9 shrink-0 cursor-pointer border border-input bg-transparent p-0.5 disabled:cursor-not-allowed"
                        disabled={travado}
                        onChange={(event) => onAlterar(faixa.chaveLocal, { cor: event.target.value.toUpperCase() })}
                        type="color"
                        value={HEX.test(faixa.cor) ? faixa.cor.toLowerCase() : COR_DO_SELETOR}
                      />
                      <Input
                        {...comum('cor')}
                        aria-label={`${nome}: cor (#RRGGBB)`}
                        className="h-9 w-24 rounded-none font-mono uppercase"
                        maxLength={7}
                        onChange={(event) => onAlterar(faixa.chaveLocal, { cor: event.target.value.trim() })}
                        value={faixa.cor}
                      />
                    </div>
                  </TableCell>
                  {podeEditar && (
                    <TableCell className="text-right align-top">
                      <BotaoIcone
                        disabled={travado || faixas.length === 1}
                        icone={Trash2}
                        onClick={() => onRemover(faixa.chaveLocal)}
                        rotulo={`Remover faixa ${nome}`}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {podeEditar && (
        <div>
          <Button
            disabled={travado || faixas.length >= SCORE.MAX_FAIXAS}
            onClick={onAdicionar}
            size="sm"
            type="button"
            variant="outline"
          >
            <Plus aria-hidden="true" />
            Nova faixa
          </Button>
        </div>
      )}
    </div>
  );
}
