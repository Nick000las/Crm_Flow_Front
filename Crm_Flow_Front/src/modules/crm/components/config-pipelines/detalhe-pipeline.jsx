/**
 * @file Um pipeline: dados, status e, em atendimento, a automação.
 */
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import {
  ROTULOS_CATEGORIA,
  ROTULOS_TIPO_PIPELINE,
  TIPOS_LISTA,
  TIPOS_PIPELINE,
} from '../../constants';
import { useAtualizarPipeline, useReordenarStatus } from '../../hooks/use-pipelines';
import { motivoNaoDesativa, motivoNaoExclui } from '../../lib/pipelines';
import { comPorcento } from '../../lib/probabilidade';
import { BotaoIcone } from '../botao-icone';
import { ExcluirOpcaoDialog } from '../config-listas/excluir-opcao-dialog';
import { OpcaoDialog } from '../config-listas/opcao-dialog';
import { TabelaOpcoes } from '../config-listas/tabela-opcoes';
import { ControleTravado } from '../controle-travado';
import { OpcaoBadge } from '../opcao-badge';
import { AutomacaoForm } from './automacao-form';
import { ExcluirPipelineDialog } from './excluir-pipeline-dialog';
import { PipelineDialog } from './pipeline-dialog';

const TITULO_CLASS = 'text-[11px] tracking-wide text-muted-foreground uppercase';

const contagem = (total) =>
  total === 1 ? '1 oportunidade' : `${total.toLocaleString('pt-BR')} oportunidades`;

/** Status para quem só lê: sem nenhum controle. */
function StatusEmLeitura({ status }) {
  return (
    <ul className="border border-border">
      {status.map((item) => (
        <li
          className="flex items-center justify-between gap-3 border-b border-border px-3 py-2 last:border-b-0"
          key={item.id}
        >
          <OpcaoBadge opcao={item} />
          <span className="text-sm text-muted-foreground">
            {ROTULOS_CATEGORIA[item.category] ?? '—'}
            {typeof item.probabilidadePadrao === 'number' && (
              <>
                {' · '}
                <span className="tabular-nums">{comPorcento(item.probabilidadePadrao)}</span>
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Vale só para OPERADOR. Ocultar o padrão pede confirmação: é onde o que o
 * OPERADOR cria nasce, e a pessoa pode sumir para ele.
 */
function VisibilidadeDoPipeline({ pipeline }) {
  const atualizar = useAtualizarPipeline();
  const [confirmando, setConfirmando] = useState(false);
  const id = `pipeline-${pipeline.id}-visivel`;
  const visivel = atualizar.isPending
    ? atualizar.variables.parcial.visivelOperador
    : pipeline.visivelOperador;

  function salvar(visivelOperador) {
    return atualizar.mutateAsync({ id: pipeline.id, parcial: { visivelOperador } });
  }

  return (
    <>
      <label className="flex items-center gap-2 text-sm" htmlFor={id}>
        <Switch
          checked={visivel}
          disabled={atualizar.isPending}
          id={id}
          onCheckedChange={(proximo) =>
            pipeline.padrao && !proximo ? setConfirmando(true) : salvar(proximo).catch(() => {})
          }
        />
        Visível para operadores
      </label>
      <ApiErrorAlert
        error={confirmando ? null : atualizar.error}
        id={`${id}-erro`}
        title="Não foi possível mudar a visibilidade"
      />
      {confirmando && (
        <ConfirmationDialog
          confirmLabel="Ocultar"
          description="O que os operadores criarem neste pipeline deixa de aparecer para eles, se a pessoa não tiver outra oportunidade visível."
          onClose={() => setConfirmando(false)}
          onConfirm={() => salvar(false)}
          pendingLabel="Ocultando…"
          title="Ocultar o pipeline padrão dos operadores?"
        />
      )}
    </>
  );
}

/** Ativo, renomear e excluir. Desativar mantém as oportunidades e impede criar novas. */
function AcoesDoPipeline({ pipeline, pipelines, onAviso }) {
  const atualizar = useAtualizarPipeline();
  const [renomeando, setRenomeando] = useState(false);
  const [desativando, setDesativando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const motivoAtivo = motivoNaoDesativa(pipeline);
  const motivoExcluir = motivoNaoExclui(pipeline, pipelines);
  const ativo = atualizar.isPending ? atualizar.variables.parcial.ativo : pipeline.ativo;
  const idBase = `pipeline-${pipeline.id}`;

  return (
    <div className="grid justify-items-end gap-1">
      <div className="flex items-center gap-2">
        <ControleTravado motivo={motivoAtivo} motivoId={`${idBase}-ativo-motivo`}>
          <label className="flex items-center gap-2 text-sm" htmlFor={`${idBase}-ativo`}>
            <Switch
              aria-describedby={motivoAtivo ? `${idBase}-ativo-motivo` : undefined}
              checked={ativo}
              className={motivoAtivo ? 'pointer-events-none' : undefined}
              disabled={atualizar.isPending || Boolean(motivoAtivo)}
              id={`${idBase}-ativo`}
              onCheckedChange={(proximo) =>
                proximo
                  ? atualizar.mutate({ id: pipeline.id, parcial: { ativo: true } })
                  : setDesativando(true)
              }
            />
            Ativo
          </label>
        </ControleTravado>
        <BotaoIcone icone={Pencil} onClick={() => setRenomeando(true)} rotulo="Renomear pipeline" />
        <ControleTravado motivo={motivoExcluir} motivoId={`${idBase}-excluir-motivo`}>
          <BotaoIcone
            aria-describedby={motivoExcluir ? `${idBase}-excluir-motivo` : undefined}
            className={motivoExcluir ? 'pointer-events-none' : undefined}
            disabled={Boolean(motivoExcluir)}
            icone={Trash2}
            variant="destructive"
            onClick={() => setExcluindo(true)}
            rotulo="Excluir pipeline"
          />
        </ControleTravado>
      </div>

      <VisibilidadeDoPipeline pipeline={pipeline} />

      <ApiErrorAlert
        error={atualizar.error}
        id={`${idBase}-ativo-erro`}
        title="Não foi possível mudar o pipeline"
      />

      {desativando && (
        <ConfirmationDialog
          confirmLabel="Desativar pipeline"
          description="As oportunidades existentes são mantidas, mas não será possível criar novas neste pipeline até reativá-lo."
          onClose={() => setDesativando(false)}
          onConfirm={async () => {
            await atualizar.mutateAsync({ id: pipeline.id, parcial: { ativo: false } });
            onAviso?.('Pipeline desativado.');
          }}
          pendingLabel="Desativando…"
          title={`Desativar “${pipeline.nome}”?`}
        />
      )}

      <PipelineDialog
        onOpenChange={setRenomeando}
        onSalvo={(nome) => onAviso(`Pipeline renomeado para "${nome}".`)}
        open={renomeando}
        pipeline={pipeline}
      />
      <ExcluirPipelineDialog
        onExcluido={(nome) => onAviso(`Pipeline "${nome}" excluído.`)}
        onOpenChange={setExcluindo}
        open={excluindo}
        pipeline={pipeline}
      />
    </div>
  );
}

/** Status editáveis: a mesma tabela de Listas, nas rotas do pipeline. */
function StatusEditaveis({ pipeline, onAviso }) {
  const reordenar = useReordenarStatus(pipeline.id);
  // `undefined` = fechado; `null` = criando; objeto = editando.
  const [emEdicao, setEmEdicao] = useState(undefined);
  const [aExcluir, setAExcluir] = useState(null);

  function abrir(acao) {
    onAviso(null);
    reordenar.reset();
    acao();
  }

  const botaoNovo = (
    <Button onClick={() => abrir(() => setEmEdicao(null))} size="sm" variant="outline">
      <Plus aria-hidden="true" />
      Novo status
    </Button>
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Mantenha ao menos um status ativo de cada categoria: aberto, ganho e perdido.
        </p>
        {botaoNovo}
      </div>

      <ApiErrorAlert
        error={reordenar.error}
        id={`pipeline-${pipeline.id}-ordem-erro`}
        title="Não foi possível salvar a ordem. A lista voltou ao que era."
      />

      <TabelaOpcoes
        acaoVazio={botaoNovo}
        onEditar={(opcao) => abrir(() => setEmEdicao(opcao))}
        onExcluir={(opcao) => abrir(() => setAExcluir(opcao))}
        onReordenar={(ids) => reordenar.mutate(ids)}
        opcoes={pipeline.status}
        ordemOcupada={reordenar.isPending}
        pipelineId={pipeline.id}
        tipo={TIPOS_LISTA.STATUS}
      />

      <OpcaoDialog
        onOpenChange={(aberto) => !aberto && setEmEdicao(undefined)}
        onSalvo={(salva) =>
          salva &&
          onAviso(
            emEdicao ? `Status "${salva.label}" atualizado.` : `Status "${salva.label}" criado.`,
          )
        }
        opcao={emEdicao}
        open={emEdicao !== undefined}
        pipelineId={pipeline.id}
        rotuloDaLista={`Status de ${pipeline.nome}`}
        tipo={TIPOS_LISTA.STATUS}
      />
      <ExcluirOpcaoDialog
        onExcluida={(label) => onAviso(`Status "${label}" excluído.`)}
        onOpenChange={(aberto) => !aberto && setAExcluir(null)}
        opcao={aExcluir}
        pipelineId={pipeline.id}
        tipo={TIPOS_LISTA.STATUS}
      />
    </>
  );
}

/**
 * Um pipeline: dados, status e, em atendimento, a automação.
 *
 * @param {{
 *   pipeline: import('../../api/pipelines.api').Pipeline,
 *   pipelines: import('../../api/pipelines.api').Pipeline[],
 *   podeEditar: boolean,
 *   onAviso: (texto: string | null) => void,
 * }} props
 */
export function DetalhePipeline({ pipeline, pipelines, podeEditar, onAviso }) {
  const comAutomacao = pipeline.tipo === TIPOS_PIPELINE.ATENDIMENTO;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h3 className="text-sm font-medium">{pipeline.nome}</h3>
          <p className="text-sm text-muted-foreground">
            {ROTULOS_TIPO_PIPELINE[pipeline.tipo]}
            {pipeline.padrao && ' · Padrão'}
            {!pipeline.ativo && ' · Inativo'}
            {!pipeline.visivelOperador && ' · Oculto para operadores'}
            {' · '}
            <span className="tabular-nums">{contagem(pipeline.oportunidades)}</span>
          </p>
        </div>
        {podeEditar && (
          <AcoesDoPipeline onAviso={onAviso} pipeline={pipeline} pipelines={pipelines} />
        )}
      </header>

      <section className="grid gap-3">
        <h4 className={TITULO_CLASS}>Status</h4>
        {podeEditar ? (
          <StatusEditaveis onAviso={onAviso} pipeline={pipeline} />
        ) : (
          <StatusEmLeitura status={pipeline.status} />
        )}
        {pipeline.padrao && (
          <p className="text-xs text-muted-foreground">
            Os dias de lead esfriando valem só para este pipeline.
          </p>
        )}
      </section>

      {comAutomacao && (
        <section className="grid gap-3">
          <h4 className={TITULO_CLASS}>Automação</h4>
          <AutomacaoForm
            onAviso={onAviso}
            pipeline={pipeline}
            pipelines={pipelines}
            podeEditar={podeEditar}
          />
        </section>
      )}
    </div>
  );
}
