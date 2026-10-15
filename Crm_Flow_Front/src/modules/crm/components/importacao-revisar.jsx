import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { ImportacaoErros } from './importacao-erros';

/**
 * Passo 3: resultado da validação da planilha inteira. Só com `jobId`
 * (ao menos uma linha válida) dá para confirmar.
 *
 * @param {{
 *   validacao: { jobId: string | null, totalLinhas: number, linhasValidas: number, erros: object[] },
 *   confirmacao: import('@tanstack/react-query').UseMutationResult,
 *   onConfirmar: () => void,
 *   onVoltar: () => void,
 * }} props
 */
export function ImportacaoRevisar({ validacao, confirmacao, onConfirmar, onVoltar }) {
  const { jobId, totalLinhas, linhasValidas, erros } = validacao;
  const filaFora = confirmacao.error?.code === 'QUEUE_UNAVAILABLE';

  return (
    <div className="grid gap-6">
      <p className="text-lg" role="status">
        <span className="font-mono tabular-nums">{linhasValidas.toLocaleString('pt-BR')}</span> válidas de{' '}
        <span className="font-mono tabular-nums">{totalLinhas.toLocaleString('pt-BR')}</span> linhas
      </p>

      {!jobId && (
        <p className="border border-border p-3 text-sm">
          Nenhuma linha pode ser importada. Volte, ajuste o mapeamento ou corrija a planilha e tente de novo.
        </p>
      )}

      <ImportacaoErros erros={erros} nomeRelatorio="erros-validacao.csv" titulo="Linhas com problema" />
      {jobId && erros.length > 0 && (
        <p className="text-sm text-muted-foreground">Ao confirmar, só as linhas válidas são importadas.</p>
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
          <Button aria-busy={confirmacao.isPending} disabled={confirmacao.isPending} onClick={onConfirmar}>
            {confirmacao.isPending ? 'Confirmando…' : filaFora ? 'Tentar novamente' : 'Confirmar importação'}
          </Button>
        )}
      </div>
    </div>
  );
}
