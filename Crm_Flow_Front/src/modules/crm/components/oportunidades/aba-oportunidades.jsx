/**
 * @file Aba "Oportunidades" do drawer: uma pessoa pode ter várias, cada uma em um pipeline e
 * com o próprio status.
 */
import { useState } from 'react';
import { ChevronDown, Handshake, Plus, Trash2 } from 'lucide-react';

import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StatusToast } from '@/components/status-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isAccessError } from '@/services/api';

import { useCampos } from '../../hooks/use-campos';
import { useAcaoDaOportunidade, useOportunidades } from '../../hooks/use-oportunidades';
import { usePipelines } from '../../hooks/use-pipelines';
import { podeAlterar, podeMudarStatus } from '../../lib/oportunidades';
import { ItemOportunidade } from './item-oportunidade';
import { LixeiraOportunidades } from './lixeira-oportunidades';
import { MudarStatusDialog } from './mudar-status-dialog';
import { OportunidadeDialog } from './oportunidade-dialog';

const CAMPOS_VAZIOS = [];
const AVISO_DA_ACAO = Object.freeze({
  arquivar: 'Oportunidade arquivada.',
  desarquivar: 'Oportunidade desarquivada.',
  excluir: 'Oportunidade na lixeira.',
});

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <LoadingState label="Carregando oportunidades…" />
      {Array.from({ length: 2 }, (_, indice) => (
        <Skeleton className="h-20" key={indice} />
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
  const [aArquivar, setAArquivar] = useState(null);
  const [aExcluir, setAExcluir] = useState(null);
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [comLixeira, setComLixeira] = useState(false);
  const [aviso, setAviso] = useState(null);
  const acao = useAcaoDaOportunidade(lead.id);

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

  function aplicar(id, nome) {
    setAviso(null);
    acao.mutate({ id, acao: nome }, { onSuccess: () => setAviso(AVISO_DA_ACAO[nome]) });
  }

  const botaoNovo = !anonimizado && (
    <Button onClick={() => abrir(() => setEmEdicao(null))} size="sm">
      <Plus aria-hidden="true" />
      Nova oportunidade
    </Button>
  );

  const ativas = oportunidades.filter((item) => !item.arquivadaEm);
  const arquivadas = oportunidades.filter((item) => Boolean(item.arquivadaEm));

  const renderItem = (oportunidade) => {
    const alteravel = podeAlterar(oportunidade, lead);
    const arquivada = Boolean(oportunidade.arquivadaEm);
    const { id } = oportunidade;

    return (
      <ItemOportunidade
        campos={campos}
        key={oportunidade.id}
        nomePorId={nomePorId}
        onArquivar={alteravel ? () => setAArquivar(oportunidade) : undefined}
        onDesarquivar={arquivada && !anonimizado ? () => aplicar(id, 'desarquivar') : undefined}
        onEditar={alteravel ? () => abrir(() => setEmEdicao(oportunidade)) : undefined}
        onExcluir={anonimizado ? undefined : () => setAExcluir(oportunidade)}
        onMudarStatus={
          alteravel && comStatus ? () => abrir(() => setMudandoStatus(oportunidade)) : undefined
        }
        oportunidade={oportunidade}
        pipelines={pipelines}
      />
    );
  };

  return (
    <div className="grid gap-4">
      {oportunidades.length > 0 && <div>{botaoNovo}</div>}

      <StatusToast message={aviso} onDismiss={() => setAviso(null)} />
      <ApiErrorAlert
        error={acao.error}
        id="oportunidades-acao-erro"
        title="Não foi possível alterar a oportunidade"
      />

      {oportunidades.length === 0 ? (
        <EmptyState
          description="Registre as negociações e os atendimentos desta pessoa."
          icon={Handshake}
          title="Nenhuma oportunidade ainda"
        >
          {botaoNovo}
        </EmptyState>
      ) : (
        <div className="grid gap-4">
          {ativas.length > 0 && <ul>{ativas.map(renderItem)}</ul>}
          {arquivadas.length > 0 && (
            <section className="grid gap-1">
              <Button
                aria-expanded={verArquivadas || ativas.length === 0}
                className="w-fit gap-1.5 px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                onClick={() => setVerArquivadas((atual) => !atual)}
                size="xs"
                type="button"
                variant="ghost"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={`size-3.5 transition-transform ${verArquivadas || ativas.length === 0 ? 'rotate-180' : ''}`}
                />
                Arquivadas ({arquivadas.length})
              </Button>
              {(verArquivadas || ativas.length === 0) && <ul>{arquivadas.map(renderItem)}</ul>}
            </section>
          )}
        </div>
      )}

      <div className="grid gap-2 border-t border-border pt-3">
        <Button
          aria-expanded={comLixeira}
          className="w-fit"
          onClick={() => setComLixeira((atual) => !atual)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <Trash2 aria-hidden="true" />
          {comLixeira ? 'Esconder a lixeira' : 'Ver a lixeira'}
        </Button>
        {comLixeira && (
          <LixeiraOportunidades
            leadId={lead.id}
            onRestaurada={() => setAviso('Oportunidade restaurada.')}
            pipelines={pipelines}
            podeRestaurar={!anonimizado}
          />
        )}
      </div>

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
      {aArquivar && (
        <ConfirmationDialog
          confirmLabel="Arquivar oportunidade"
          description="Ela sairá do quadro ativo, mas poderá ser desarquivada a qualquer momento nesta aba."
          onClose={() => setAArquivar(null)}
          onConfirm={async () => {
            await acao.mutateAsync({ id: aArquivar.id, acao: 'arquivar' });
            setAviso(AVISO_DA_ACAO.arquivar);
          }}
          pendingLabel="Arquivando…"
          title="Arquivar esta oportunidade?"
        />
      )}
      {aExcluir && (
        <ConfirmationDialog
          confirmLabel="Mover para a lixeira"
          description="Ela sai da ficha e do quadro. Dá para restaurar pela lixeira desta aba."
          onClose={() => setAExcluir(null)}
          onConfirm={async () => {
            await acao.mutateAsync({ id: aExcluir.id, acao: 'excluir' });
            setAviso(AVISO_DA_ACAO.excluir);
          }}
          pendingLabel="Movendo…"
          title="Mover esta oportunidade para a lixeira?"
        />
      )}
    </div>
  );
}
