import { Handshake, Plus } from 'lucide-react';
import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isAccessError } from '@/services/api';
import { useCampos } from '../../hooks/use-campos';
import { useOportunidades } from '../../hooks/use-oportunidades';
import { usePipelines } from '../../hooks/use-pipelines';
import { podeAlterar, podeMudarStatus } from '../../lib/oportunidades';
import { ItemOportunidade } from './item-oportunidade';
import { MudarStatusDialog } from './mudar-status-dialog';
import { OportunidadeDialog } from './oportunidade-dialog';

const CAMPOS_VAZIOS = [];

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando oportunidades…
      </span>
      {Array.from({ length: 2 }, (_, indice) => (
        <Skeleton className="h-20 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/**
 * Aba "Oportunidades" do drawer: uma pessoa pode ter várias, cada uma em um
 * pipeline e com o próprio status. Os dados comerciais do lead vêm da
 * principal, que o back escolhe. Nomes e status vêm dos pipelines, liberados
 * a todos os papéis, e a permissão de cada campo, de `/fields` inteiro (não só
 * dos campos da Ficha).
 *
 * @param {{ lead: import('../../types').Lead, nomePorId: Map<string, string> }} props
 */
export function AbaOportunidades({ lead, nomePorId }) {
  const oportunidadesQuery = useOportunidades(lead.id);
  const pipelinesQuery = usePipelines();
  const camposQuery = useCampos();
  // `undefined` = fechado; `null` = criando; objeto = editando.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const [mudandoStatus, setMudandoStatus] = useState(null);
  const [aviso, setAviso] = useState(null);

  const erro = oportunidadesQuery.error ?? pipelinesQuery.error;
  if (isAccessError(erro)) {
    return <AcessoIndisponivel error={erro} />;
  }
  if (erro) {
    return <ApiErrorAlert error={erro} id="oportunidades-erro" />;
  }
  if (oportunidadesQuery.isPending || pipelinesQuery.isPending) {
    return <Carregando />;
  }

  const oportunidades = oportunidadesQuery.data;
  const pipelines = pipelinesQuery.data;
  const campos = camposQuery.data ?? CAMPOS_VAZIOS;
  const anonimizado = Boolean(lead.anonimizado_em);
  const comStatus = podeMudarStatus(campos);

  function abrir(acao) {
    setAviso(null);
    acao();
  }

  const botaoNovo = !anonimizado && (
    <Button onClick={() => abrir(() => setEmEdicao(null))} size="sm">
      <Plus aria-hidden="true" />
      Nova oportunidade
    </Button>
  );

  return (
    <div className="grid gap-4">
      {oportunidades.length > 0 && <div>{botaoNovo}</div>}

      <p className={aviso ? 'border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      {oportunidades.length === 0 ? (
        <ModulePlaceholder
          description="Registre as negociações e os atendimentos desta pessoa."
          icon={Handshake}
          title="Nenhuma oportunidade ainda"
        >
          {botaoNovo}
        </ModulePlaceholder>
      ) : (
        <ul>
          {oportunidades.map((oportunidade) => {
            const alteravel = podeAlterar(oportunidade, lead);

            return (
              <ItemOportunidade
                campos={campos}
                key={oportunidade.id}
                nomePorId={nomePorId}
                onEditar={alteravel ? () => abrir(() => setEmEdicao(oportunidade)) : undefined}
                onMudarStatus={
                  alteravel && comStatus
                    ? () => abrir(() => setMudandoStatus(oportunidade))
                    : undefined
                }
                oportunidade={oportunidade}
                pipelines={pipelines}
              />
            );
          })}
        </ul>
      )}

      <OportunidadeDialog
        campos={campos}
        lead={lead}
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        onSalvo={(texto) => texto && setAviso(texto)}
        open={emEdicao !== undefined}
        oportunidade={emEdicao}
        pipelines={pipelines}
      />
      <MudarStatusDialog
        campos={campos}
        leadId={lead.id}
        onOpenChange={(aberto) => !aberto && setMudandoStatus(null)}
        onSalvo={setAviso}
        oportunidade={mudandoStatus}
        pipelines={pipelines}
      />
    </div>
  );
}
