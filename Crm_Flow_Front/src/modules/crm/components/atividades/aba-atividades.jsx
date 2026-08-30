/**
 * @file Aba "Atividades" do drawer (`crm.atividades`): em aberto e concluídas, com registrar,
 * concluir/reabrir, editar e remover.
 */
import { useState } from 'react';
import { ChevronDown, ListTodo, Plus } from 'lucide-react';

import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { EmptyState } from '@/components/empty-state';
import { LoadingState } from '@/components/loading-state';
import { StatusToast } from '@/components/status-toast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { isAccessError } from '@/services/api';

import { TIPOS_LISTA } from '../../constants';
import { useAtividades, useEditarAtividade } from '../../hooks/use-atividades';
import { useListas } from '../../hooks/use-listas';
import { separarAtividades } from '../../lib/atividades';
import { AtividadeDialog } from './atividade-dialog';
import { ExcluirAtividadeDialog } from './excluir-atividade-dialog';
import { ItemAtividade } from './item-atividade';

function Carregando() {
  return (
    <div className="grid gap-2" aria-busy="true">
      <LoadingState label="Carregando atividades…" />
      {Array.from({ length: 3 }, (_, indice) => (
        <Skeleton className="h-14" key={indice} />
      ))}
    </div>
  );
}

function Grupo({ titulo, children }) {
  return (
    <section className="grid gap-1">
      <h3 className="text-[11px] tracking-wide text-muted-foreground uppercase">{titulo}</h3>
      <ul>{children}</ul>
    </section>
  );
}

/**
 * Aba "Atividades" do drawer (`crm.atividades`): em aberto e concluídas,
 * com registrar, concluir/reabrir, editar e remover.
 *
 * @param {{ leadId: string }} props
 */
export function AbaAtividades({ leadId }) {
  const atividadesQuery = useAtividades(leadId);
  const listasQuery = useListas();
  const alternar = useEditarAtividade(leadId);
  // `undefined` = fechado; `null` = registrando; objeto = editando.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const [aExcluir, setAExcluir] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [verConcluidas, setVerConcluidas] = useState(false);

  const tipos = listasQuery.data?.[TIPOS_LISTA.TIPO_ATIVIDADE];

  if (isAccessError(atividadesQuery.error)) {
    return <AcessoIndisponivel error={atividadesQuery.error} />;
  }

  if (atividadesQuery.error) {
    return <ApiErrorAlert error={atividadesQuery.error} id="atividades-erro" />;
  }

  if (atividadesQuery.isPending) {
    return <Carregando />;
  }

  const { abertas, concluidas } = separarAtividades(atividadesQuery.data);

  function abrir(acao) {
    setAviso(null);
    alternar.reset();
    acao();
  }

  function alternarConclusao(atividade, concluida) {
    setAviso(null);

    alternar.mutate(
      { id: atividade.id, parcial: { concluida } },
      { onSuccess: () => setAviso(concluida ? 'Atividade concluída.' : 'Atividade reaberta.') },
    );
  }

  const item = (atividade) => (
    <ItemAtividade
      atividade={atividade}
      key={atividade.id}
      ocupado={alternar.isPending && alternar.variables?.id === atividade.id}
      onAlternar={(concluida) => alternarConclusao(atividade, concluida)}
      onEditar={() => abrir(() => setEmEdicao(atividade))}
      onExcluir={() => abrir(() => setAExcluir(atividade))}
      tipos={tipos}
    />
  );

  return (
    <div className="grid gap-4">
      <div>
        <Button onClick={() => abrir(() => setEmEdicao(null))} size="sm">
          <Plus aria-hidden="true" />
          Registrar atividade
        </Button>
      </div>

      <StatusToast message={aviso} onDismiss={() => setAviso(null)} />
      <ApiErrorAlert
        error={alternar.error}
        id="atividade-alternar-erro"
        title="Não foi possível mudar a atividade"
      />

      {abertas.length === 0 && concluidas.length === 0 ? (
        <EmptyState
          description="Registre ligações, reuniões e tarefas para acompanhar o que foi feito com este lead."
          icon={ListTodo}
          title="Nenhuma atividade ainda"
        />
      ) : (
        <>
          {abertas.length > 0 && <Grupo titulo="Em aberto">{abertas.map(item)}</Grupo>}
          {concluidas.length > 0 && (
            <section className="grid gap-1">
              <Button
                aria-expanded={verConcluidas || abertas.length === 0}
                className="w-fit gap-1.5 px-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase"
                onClick={() => setVerConcluidas((atual) => !atual)}
                size="xs"
                type="button"
                variant="ghost"
              >
                <ChevronDown
                  aria-hidden="true"
                  className={`size-3.5 transition-transform ${verConcluidas || abertas.length === 0 ? 'rotate-180' : ''}`}
                />
                Concluídas ({concluidas.length})
              </Button>
              {(verConcluidas || abertas.length === 0) && <ul>{concluidas.map(item)}</ul>}
            </section>
          )}
        </>
      )}

      <AtividadeDialog
        atividade={emEdicao}
        erroDosTipos={listasQuery.error}
        leadId={leadId}
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        onSalvo={(texto) => texto && setAviso(texto)}
        open={emEdicao !== undefined}
        tipos={tipos}
      />
      <ExcluirAtividadeDialog
        atividade={aExcluir}
        leadId={leadId}
        onExcluida={() => setAviso('Atividade removida.')}
        onOpenChange={(aberto) => !aberto && setAExcluir(null)}
      />
    </div>
  );
}
