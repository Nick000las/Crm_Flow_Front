import { useState } from 'react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ACOES_DUPLICIDADE, ROTULOS_ESTRATEGIA } from '../constants';
import { useConfigLgpd } from '../hooks/use-lgpd';
import {
  SEGUIR_ESTRATEGIA,
  acoesParaEnvio,
  descreverCandidato,
  opcoesDeAcaoImport,
} from '../lib/duplicidade';
import { ImportacaoErros } from './importacao-erros';
import { SelectSimples } from './select-simples';

const LIMITE_LINHAS = 100;

/**
 * Linhas parecidas com leads que já existem (`crm.duplicidade`): cada uma
 * pode seguir a estratégia geral ou ter a ação própria. "Criar" some onde a
 * regra bloqueia.
 */
function LinhasDuplicadas({ duplicados, estrategia, escolhas, onEscolher }) {
  const visiveis = duplicados.slice(0, LIMITE_LINHAS);
  const seguir = `Seguir a estratégia (${ROTULOS_ESTRATEGIA[estrategia]?.rotulo ?? estrategia})`;

  return (
    <section aria-labelledby="importacao-duplicadas-titulo" className="grid gap-2">
      <h3 className="text-sm font-medium" id="importacao-duplicadas-titulo">
        Parecidas com leads existentes{' '}
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          ({duplicados.length})
        </span>
      </h3>
      <ul className="border border-border">
        {visiveis.map((duplicado) => {
          const bloqueada = duplicado.acao === ACOES_DUPLICIDADE.BLOQUEAR;
          const id = `importacao-acao-${duplicado.linha}`;

          return (
            <li
              className="grid gap-2 border-b border-border p-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center"
              key={duplicado.linha}
            >
              <div className="grid gap-1 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs tabular-nums">Linha {duplicado.linha}</span>
                  {bloqueada && (
                    <Badge className="rounded-none" variant="outline">
                      Bloqueada: não pode criar
                    </Badge>
                  )}
                </p>
                <ul className="text-muted-foreground">
                  {duplicado.leads.map((lead) => (
                    <li key={lead.id}>
                      {lead.nome} — {descreverCandidato(lead)}
                    </li>
                  ))}
                </ul>
              </div>
              <label className="sr-only" htmlFor={id}>
                O que fazer com a linha {duplicado.linha}
              </label>
              <SelectSimples
                id={id}
                onChange={(acao) => onEscolher(duplicado.linha, acao)}
                opcoes={opcoesDeAcaoImport(duplicado)}
                vazio={seguir}
                value={escolhas[duplicado.linha] ?? SEGUIR_ESTRATEGIA}
              />
            </li>
          );
        })}
      </ul>
      {duplicados.length > LIMITE_LINHAS && (
        <p className="text-xs text-muted-foreground">
          Mostrando as primeiras {LIMITE_LINHAS}; as demais seguem a estratégia escolhida.
        </p>
      )}
    </section>
  );
}

/**
 * Passo 3: resultado da validação da planilha inteira. Só com `jobId`
 * (ao menos uma linha válida) dá para confirmar.
 *
 * @param {{
 *   validacao: {
 *     jobId: string | null,
 *     totalLinhas: number,
 *     linhasValidas: number,
 *     erros: object[],
 *     duplicados?: import('../lib/duplicidade').DuplicadoDoImport[],
 *   },
 *   estrategia: string,
 *   baseLegalLote?: string,
 *   confirmacao: import('@tanstack/react-query').UseMutationResult,
 *   onConfirmar: (acoes: Record<string, string> | null) => void,
 *   onVoltar: () => void,
 * }} props
 */
export function ImportacaoRevisar({
  validacao,
  estrategia,
  baseLegalLote = '',
  confirmacao,
  onConfirmar,
  onVoltar,
}) {
  const lgpd = useConfigLgpd().data ?? null;
  const rotuloDoLote =
    lgpd?.basesLegais.find((base) => base.key === baseLegalLote)?.label ?? baseLegalLote;
  const { jobId, totalLinhas, linhasValidas, erros } = validacao;
  const duplicados = validacao.duplicados ?? [];
  const [escolhas, setEscolhas] = useState({});
  const filaFora = confirmacao.error?.code === 'QUEUE_UNAVAILABLE';

  return (
    <div className="grid gap-6">
      <p className="text-lg" role="status">
        <span className="font-mono tabular-nums">{linhasValidas.toLocaleString('pt-BR')}</span>{' '}
        válidas de{' '}
        <span className="font-mono tabular-nums">{totalLinhas.toLocaleString('pt-BR')}</span> linhas
      </p>

      {!jobId && (
        <p className="border border-border p-3 text-sm">
          Nenhuma linha pode ser importada. Volte, ajuste o mapeamento ou corrija a planilha e tente
          de novo.
        </p>
      )}

      {baseLegalLote && (
        <p className="text-sm text-muted-foreground">
          Base legal do lote: <span className="text-foreground">{rotuloDoLote}</span> (nas linhas
          sem base).
        </p>
      )}

      <ImportacaoErros
        erros={erros}
        nomeRelatorio="erros-validacao.csv"
        titulo="Linhas com problema"
      />
      {jobId && duplicados.length > 0 && (
        <LinhasDuplicadas
          duplicados={duplicados}
          escolhas={escolhas}
          estrategia={estrategia}
          onEscolher={(linha, acao) => {
            confirmacao.reset();
            setEscolhas((atuais) => ({ ...atuais, [linha]: acao }));
          }}
        />
      )}

      {jobId && erros.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Ao confirmar, só as linhas válidas são importadas.
        </p>
      )}

      <ApiErrorAlert
        error={confirmacao.error}
        id="importacao-confirmar-erro"
        title={filaFora ? 'Fila de importação indisponível' : 'Não foi possível confirmar'}
      />

      <div className="flex flex-wrap gap-2">
        <Button disabled={confirmacao.isPending} onClick={onVoltar} variant="outline">
          Voltar ao mapeamento
        </Button>
        {jobId && (
          <Button
            aria-busy={confirmacao.isPending}
            disabled={confirmacao.isPending}
            onClick={() => onConfirmar(acoesParaEnvio(escolhas))}
          >
            {confirmacao.isPending
              ? 'Confirmando…'
              : filaFora
                ? 'Tentar novamente'
                : 'Confirmar importação'}
          </Button>
        )}
      </div>
    </div>
  );
}
