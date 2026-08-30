/**
 * @file Configurações › Pipelines: um pipeline por aba (`?pipeline=`, para dar link direto),
 * com os status e a automação. Todos leem; alterar, só gestão.
 */
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { isAccessError } from '@/services/api';

import { LIMITE_PIPELINES, PAPEIS_GESTAO } from '../../constants';
import { usePipelines } from '../../hooks/use-pipelines';
import { ControleTravado } from '../controle-travado';
import { DetalhePipeline } from './detalhe-pipeline';
import { PipelineDialog } from './pipeline-dialog';

const PARAM_PIPELINE = 'pipeline';
const MOTIVO_LIMITE = `O limite é de ${LIMITE_PIPELINES} pipelines, incluindo Vendas e Atendimento.`;

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <LoadingState label="Carregando pipelines…" />
      {Array.from({ length: 5 }, (_, indice) => (
        <Skeleton className="h-11" key={indice} />
      ))}
    </div>
  );
}

/**
 * Configurações › Pipelines: um pipeline por aba (`?pipeline=`, para dar link
 * direto), com os status e a automação. Todos leem; alterar, só gestão.
 */
export function SecaoPipelines() {
  const { user } = useAuth();
  const podeEditar = podeVer({ roles: PAPEIS_GESTAO }, user);
  const [searchParams, setSearchParams] = useSearchParams();
  const pipelinesQuery = usePipelines();
  const [criando, setCriando] = useState(false);
  const [aviso, setAviso] = useState(null);

  if (isAccessError(pipelinesQuery.error)) {
    return <AcessoIndisponivel error={pipelinesQuery.error} />;
  }

  if (pipelinesQuery.error) {
    return <ApiErrorAlert error={pipelinesQuery.error} id="config-pipelines-carregar-erro" />;
  }

  if (pipelinesQuery.isPending) {
    return <Carregando />;
  }

  const pipelines = pipelinesQuery.data;
  const atual =
    pipelines.find((pipeline) => pipeline.id === searchParams.get(PARAM_PIPELINE)) ?? pipelines[0];
  const noLimite = pipelines.length >= LIMITE_PIPELINES;
  const motivoNovo = noLimite ? MOTIVO_LIMITE : null;

  function abrirPipeline(id) {
    setAviso(null);
    setSearchParams({ [PARAM_PIPELINE]: id }, { replace: true });
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Cada pipeline tem os próprios status. Uma pessoa pode ter oportunidades em vários deles.
        </p>
        {podeEditar && (
          <ControleTravado motivo={motivoNovo} motivoId="pipeline-novo-motivo">
            <Button
              aria-describedby={motivoNovo ? 'pipeline-novo-motivo' : undefined}
              className={motivoNovo ? 'pointer-events-none' : undefined}
              disabled={noLimite}
              onClick={() => {
                setAviso(null);
                setCriando(true);
              }}
            >
              <Plus aria-hidden="true" />
              Novo pipeline
            </Button>
          </ControleTravado>
        )}
      </div>

      <p
        className={
          aviso ? 'rounded-lg border border-border bg-surface px-3 py-2 text-sm' : 'sr-only'
        }
        role="status"
      >
        {aviso}
      </p>

      <Tabs onValueChange={abrirPipeline} value={atual?.id}>
        <TabsList className="mb-4 flex-wrap" variant="line">
          {pipelines.map((pipeline) => (
            <TabsTrigger key={pipeline.id} value={pipeline.id}>
              {pipeline.nome}
              {!pipeline.ativo && <span className="text-muted-foreground"> (inativo)</span>}
            </TabsTrigger>
          ))}
        </TabsList>

        {atual && (
          <TabsContent value={atual.id}>
            <DetalhePipeline
              key={atual.id}
              onAviso={setAviso}
              pipeline={atual}
              pipelines={pipelines}
              podeEditar={podeEditar}
            />
          </TabsContent>
        )}
      </Tabs>

      <PipelineDialog
        onOpenChange={setCriando}
        onSalvo={(nome) => setAviso(`Pipeline "${nome}" criado.`)}
        open={criando}
      />
    </div>
  );
}
