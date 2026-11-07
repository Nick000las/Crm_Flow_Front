import { RotateCcw } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAcaoDaOportunidade, useLixeiraDeOportunidades } from '../../hooks/use-oportunidades';

/**
 * Oportunidades excluídas da pessoa. Montada só ao abrir, então só aí busca.
 * Não existe "excluir de vez" pela tela.
 *
 * @param {{
 *   leadId: string,
 *   pipelines: import('../../api/pipelines.api').Pipeline[],
 *   podeRestaurar: boolean,
 *   onRestaurada: () => void,
 * }} props
 */
export function LixeiraOportunidades({ leadId, pipelines, podeRestaurar, onRestaurada }) {
  const lixeiraQuery = useLixeiraDeOportunidades(leadId);
  const acao = useAcaoDaOportunidade(leadId);

  if (lixeiraQuery.error) {
    return <ApiErrorAlert error={lixeiraQuery.error} id="oportunidades-lixeira-erro" />;
  }
  if (lixeiraQuery.isPending) {
    return (
      <div aria-busy="true">
        <span className="sr-only" role="status">
          Carregando lixeira…
        </span>
        <Skeleton className="h-10 rounded-none" />
      </div>
    );
  }
  if (lixeiraQuery.data.length === 0) {
    return <p className="text-sm text-muted-foreground">A lixeira está vazia.</p>;
  }

  return (
    <div className="grid gap-2">
      <ApiErrorAlert
        error={acao.error}
        id="oportunidades-restaurar-erro"
        title="Não foi possível restaurar"
      />
      <ul className="grid gap-2">
        {lixeiraQuery.data.map((oportunidade) => {
          const pipeline = pipelines.find((item) => item.id === oportunidade.pipelineId);
          const titulo = oportunidade.titulo || (pipeline?.nome ?? 'Pipeline removido');

          return (
            <li
              className="flex items-center justify-between gap-2 border border-border px-3 py-2 text-sm"
              key={oportunidade.id}
            >
              <span className="min-w-0 break-words">{titulo}</span>
              {podeRestaurar && (
                <Button
                  aria-label={`Restaurar ${titulo}`}
                  className="rounded-none"
                  disabled={acao.isPending}
                  onClick={() =>
                    acao.mutate(
                      { id: oportunidade.id, acao: 'restaurar' },
                      { onSuccess: onRestaurada },
                    )
                  }
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <RotateCcw aria-hidden="true" />
                  Restaurar
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
