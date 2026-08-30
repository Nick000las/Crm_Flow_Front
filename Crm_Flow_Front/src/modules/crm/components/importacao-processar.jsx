import { Link } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IMPORT_JOB_STATUS } from '../constants';
import { useConfirmarImportacao, useImportacao } from '../hooks/use-importacao';
import { percentualConcluido } from '../lib/importacao';
import { ROTAS_CRM } from '../rotas';
import { ImportacaoErros } from './importacao-erros';

const CONTADORES = Object.freeze([
  { chave: 'linhas_criadas', rotulo: 'Criadas' },
  { chave: 'linhas_atualizadas', rotulo: 'Atualizadas' },
  { chave: 'linhas_ignoradas', rotulo: 'Ignoradas' },
  { chave: 'linhas_com_erro', rotulo: 'Com erro' },
]);

const formatar = (numero) => (numero ?? 0).toLocaleString('pt-BR');

function Progresso({ job }) {
  const percentual = percentualConcluido(job);

  return (
    <div className="grid gap-2">
      <div
        aria-label="Progresso da importação"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentual}
        className="h-2 w-full border border-border"
        role="progressbar"
      >
        <div
          className="h-full bg-foreground transition-[width] duration-200"
          style={{ width: `${percentual}%` }}
        />
      </div>
      <p className="font-mono text-xs text-muted-foreground tabular-nums">
        {formatar(job.linhas_processadas)} / {formatar(job.total_linhas)} linhas · {percentual}%
      </p>
    </div>
  );
}

function Contadores({ job }) {
  return (
    <dl className="grid grid-cols-2 border border-border sm:grid-cols-4">
      {CONTADORES.map(({ chave, rotulo }) => (
        <div className="grid gap-1 border-border p-3 not-last:border-r" key={chave}>
          <dt className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
            {rotulo}
          </dt>
          <dd className="font-mono text-xl tabular-nums">{formatar(job[chave])}</dd>
        </div>
      ))}
    </dl>
  );
}

const MENSAGEM_POR_STATUS = Object.freeze({
  [IMPORT_JOB_STATUS.PENDENTE]: 'A importação ainda não entrou na fila. Confirme para começar.',
  [IMPORT_JOB_STATUS.PROCESSANDO]:
    'Importando… pode sair desta tela: o processamento continua e o link acompanha.',
  [IMPORT_JOB_STATUS.CONCLUIDO]: 'Importação concluída.',
  [IMPORT_JOB_STATUS.FALHOU]:
    'A importação falhou no meio do processamento. As linhas já gravadas continuam nos leads.',
});

/**
 * Passo 4: acompanha o job (polling a cada 2 s enquanto `processando`).
 * Também é a tela de retomada: o `jobId` vem da URL (`?job=`).
 *
 * @param {{ jobId: string, onNovaImportacao: () => void }} props
 */
export function ImportacaoProcessar({ jobId, onNovaImportacao }) {
  const { data: job, error, isPending } = useImportacao(jobId);
  const confirmar = useConfirmarImportacao();

  if (error) {
    return (
      <ApiErrorAlert
        error={error}
        id="importacao-status-erro"
        title="Não foi possível acompanhar"
      />
    );
  }
  if (isPending) {
    return <Skeleton className="h-24 rounded-none" />;
  }

  const pendente = job.status === IMPORT_JOB_STATUS.PENDENTE;
  const terminou =
    job.status === IMPORT_JOB_STATUS.CONCLUIDO || job.status === IMPORT_JOB_STATUS.FALHOU;
  const filaFora = confirmar.error?.code === 'QUEUE_UNAVAILABLE';

  return (
    <div className="grid gap-6">
      <p aria-live="polite" className="text-sm">
        {MENSAGEM_POR_STATUS[job.status] ?? job.status}
      </p>

      {!pendente && <Progresso job={job} />}
      {!pendente && <Contadores job={job} />}

      <ImportacaoErros
        erros={job.relatorio_erro ?? []}
        nomeRelatorio="erros-importacao.csv"
        titulo="Linhas que falharam ao gravar"
      />

      <ApiErrorAlert
        error={confirmar.error}
        id="importacao-reconfirmar-erro"
        title={filaFora ? 'Fila de importação indisponível' : 'Não foi possível confirmar'}
      />

      <div className="flex flex-wrap gap-2">
        {pendente && (
          <Button
            aria-busy={confirmar.isPending}
            disabled={confirmar.isPending}
            onClick={() => confirmar.mutate(jobId)}
          >
            {confirmar.isPending
              ? 'Confirmando…'
              : filaFora
                ? 'Tentar novamente'
                : 'Confirmar importação'}
          </Button>
        )}
        {terminou && (
          <>
            <Link className={buttonVariants()} to={ROTAS_CRM.LISTA}>
              Ver leads
            </Link>
            <Button onClick={onNovaImportacao} variant="outline">
              Nova importação
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
