import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useQueryClient } from '@tanstack/react-query';
import { KanbanSquare, RefreshCw, Settings2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { ModulePlaceholder } from '@/components/module-placeholder';
import { PageHeader } from '@/components/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { cn } from '@/lib/utils';
import { isAccessError, toApiError } from '@/services/api';
import { CamposObrigatoriosDialog } from '../components/quadro/campos-obrigatorios-dialog';
import { CardArrastado } from '../components/quadro/card-quadro';
import { FiltroComCampoOculto } from '../components/filtro-com-campo-oculto';
import { ColunaQuadro } from '../components/quadro/coluna-quadro';
import { FiltrosDoQuadro } from '../components/quadro/filtros-do-quadro';
import { NovoCardDialog } from '../components/quadro/novo-card-dialog';
import { PAPEIS_GESTAO } from '../constants';
import { useCampos } from '../hooks/use-campos';
import { useEstadoLista } from '../hooks/use-estado-lista';
import { useFiltroPermitido } from '../hooks/use-filtro-permitido';
import { useOrdemDoQuadro } from '../hooks/use-ordem-do-quadro';
import { usePipelines } from '../hooks/use-pipelines';
import { useCardsDaColuna, useColunasDoQuadro, useMoverCard } from '../hooks/use-quadro';
import { useTempoRealDoQuadro } from '../hooks/use-tempo-real-do-quadro';
import { useUsuarios } from '../hooks/use-usuarios';
import { chavesComErro, chavesForaDosCampos, filtroSemChaves } from '../lib/filtro';
import { podeMudarStatus } from '../lib/oportunidades';
import { CODIGO_CAMPOS_OBRIGATORIOS } from '../lib/quadro';
import { avisoDoMovimento, montarConsulta } from '../lib/quadro-consulta';
import { crmKeys } from '../query-keys';
import { ABAS_LEAD, ROTAS_CRM, idCardDoQuadro } from '../rotas';

const CAMPOS_VAZIOS = [];
const STATUS_NAO_ENCONTRADO = 404;
// Um clique no título não deve virar arrasto sem querer.
const DISTANCIA_MINIMA_PX = 4;

function Carregando() {
  return (
    <div className="flex gap-3" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando quadro…
      </span>
      {Array.from({ length: 4 }, (_, indice) => (
        <Skeleton className="h-64 w-72 shrink-0 rounded-none" key={indice} />
      ))}
    </div>
  );
}

function QuadroIndisponivel() {
  return (
    <ModulePlaceholder
      description="Este pipeline foi desativado ou não está disponível para você."
      icon={KanbanSquare}
      title="Quadro indisponível"
    >
      <Link className={cn(buttonVariants({ variant: 'outline' }), 'rounded-none')} to="/kanban">
        Voltar aos quadros
      </Link>
    </ModulePlaceholder>
  );
}

/**
 * Quadro comercial: um pipeline, com cada status em uma coluna. A estrutura não
 * se edita aqui, e sim em Configurações › Pipelines. A ficha do lead abre por
 * cima, em rota filha, e devolve ao quadro (`baseDoLead`). Busca e filtro moram
 * na URL, como na lista; quem filtra e ordena é o servidor. O socket vem do
 * `KanbanLayout`, pelo `Outlet`: o CRM não importa o Kanban.
 */
export default function QuadroPage() {
  const { quadroRef } = useParams();
  const { user } = useAuth();
  const { state, search } = useLocation();
  const socket = useOutletContext()?.socket;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const colunasQuery = useColunasDoQuadro(quadroRef);
  const pipelinesQuery = usePipelines();
  const camposQuery = useCampos();
  const { estado: estadoDaUrl, atualizar } = useEstadoLista();
  const { filtro, comValor, camposDoFiltro } = useFiltroPermitido(
    estadoDaUrl.filtro,
    camposQuery.data,
  );
  const campos = camposQuery.data ?? CAMPOS_VAZIOS;
  const { ordem, escolher: escolherOrdem } = useOrdemDoQuadro(user?.tenantId, quadroRef, campos);
  const estado = useMemo(() => ({ ...estadoDaUrl, filtro }), [estadoDaUrl, filtro]);
  // Sem `/fields`, não se sabe o que o papel pode pedir: as colunas esperam, em
  // vez de buscar duas vezes ou levar um 400 pela ordem salva.
  const consulta = camposQuery.data ? montarConsulta(estado, ordem) : null;
  const { usuarios, nomePorId } = useUsuarios();
  const mover = useMoverCard(quadroRef, consulta);
  const [arrastado, setArrastado] = useState(null);
  const { semAcesso } = useTempoRealDoQuadro({
    socket,
    quadroRef,
    consulta,
    ocupado: Boolean(arrastado) || mover.isPending,
  });
  const [pendencia, setPendencia] = useState(null);
  const [adicionandoEm, setAdicionandoEm] = useState(null);
  const [aviso, setAviso] = useState(null);
  const [erroAoMover, setErroAoMover] = useState(null);
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: DISTANCIA_MINIMA_PX } }),
  );

  const base = ROTAS_CRM.quadro(quadroRef);
  const colunas = colunasQuery.data;
  // A mesma query da primeira coluna, sem outra requisição: um filtro recusado
  // vem igual em todas, e vira um aviso só.
  const erroDosCards = useCardsDaColuna(quadroRef, colunas?.[0]?.ref, consulta).error;
  const errosDeFiltro = chavesComErro(erroDosCards?.fields);
  const ocultosNoFiltro = chavesForaDosCampos(erroDosCards?.fields, campos);
  const pipeline = pipelinesQuery.data?.find((item) => item.id === quadroRef);
  // Criar na coluna escolhe um status. Arrastar é por card (`podeMover`).
  const podeAdicionar = podeMudarStatus(campos);
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);

  function moverCard(card, de, destino, { devolverFoco = false } = {}) {
    setAviso(null);
    setErroAoMover(null);
    mover.mutate(
      { card, de, para: destino.ref },
      {
        onSuccess: (resposta) => setAviso(avisoDoMovimento(resposta)),
        onError: (error) => {
          const erro = toApiError(error);
          if (erro.code === CODIGO_CAMPOS_OBRIGATORIOS) {
            setPendencia({ card, de, destino, erro });
          } else {
            setErroAoMover(erro);
          }
        },
      },
    );
    if (devolverFoco) {
      // O card remontou na outra coluna: o foco iria para o `body`.
      requestAnimationFrame(() =>
        document.getElementById(idCardDoQuadro(card.entidadeId))?.focus(),
      );
    }
  }

  function aoSoltar({ active, over }) {
    setArrastado(null);
    const destino = over?.data.current?.coluna;
    const { card, colunaRef } = active.data.current;
    if (destino && destino.ref !== colunaRef) {
      moverCard(card, colunaRef, destino);
    }
  }

  function abrirCard(card) {
    navigate(
      { pathname: `${base}/leads/${encodeURIComponent(card.leadId)}`, search },
      {
        state: {
          aba: ABAS_LEAD.OPORTUNIDADES,
          focoAoFechar: idCardDoQuadro(card.entidadeId),
        },
      },
    );
  }

  const acoes = (
    <>
      <Button
        className="rounded-none"
        onClick={() => queryClient.invalidateQueries({ queryKey: crmKeys.quadro(quadroRef) })}
        type="button"
        variant="outline"
      >
        <RefreshCw aria-hidden="true" />
        Atualizar
      </Button>
      {gestao && (
        <Link
          className={cn(buttonVariants({ variant: 'outline' }), 'rounded-none')}
          to={ROTAS_CRM.pipelineNaConfiguracao(quadroRef)}
        >
          <Settings2 aria-hidden="true" />
          Editar estrutura
        </Link>
      )}
    </>
  );

  const erroDoFiltro = errosDeFiltro.size > 0 ? erroDosCards : null;
  const erro = colunasQuery.error ?? camposQuery.error ?? erroDoFiltro;

  let conteudo;
  if (isAccessError(erro)) {
    conteudo = <AcessoIndisponivel error={erro} />;
  } else if (semAcesso || erro?.status === STATUS_NAO_ENCONTRADO) {
    conteudo = <QuadroIndisponivel />;
  } else if (ocultosNoFiltro.length > 0) {
    conteudo = (
      <FiltroComCampoOculto
        onTirar={() => atualizar({ filtro: filtroSemChaves(estado.filtro, ocultosNoFiltro) })}
      />
    );
  } else if (erro) {
    conteudo = <ApiErrorAlert error={erro} id="quadro-erro" />;
  } else if (colunasQuery.isPending) {
    conteudo = <Carregando />;
  } else {
    conteudo = (
      <DndContext
        onDragCancel={() => setArrastado(null)}
        onDragEnd={aoSoltar}
        onDragStart={({ active }) => setArrastado(active.data.current.card)}
        sensors={sensores}
      >
        <div className="flex items-start gap-3 overflow-x-auto pb-4">
          {colunas.map((coluna) => (
            <ColunaQuadro
              campos={campos}
              coluna={coluna}
              colunas={colunas}
              consulta={consulta}
              key={coluna.ref}
              nomePorId={nomePorId}
              onAbrir={abrirCard}
              onAdicionar={podeAdicionar ? () => setAdicionandoEm(coluna) : undefined}
              onMover={(card, de, destino) => moverCard(card, de, destino, { devolverFoco: true })}
              quadroRef={quadroRef}
            />
          ))}
        </div>
        <DragOverlay>
          {arrastado && <CardArrastado campos={campos} card={arrastado} nomePorId={nomePorId} />}
        </DragOverlay>
      </DndContext>
    );
  }

  return (
    <>
      <PageHeader
        actions={acoes}
        description="Arraste os cards ou use “Mover para…”. Cada coluna é um status."
        title={pipeline?.nome ?? 'Quadro'}
      />

      <FiltrosDoQuadro
        atualizar={atualizar}
        campos={campos}
        camposDoFiltro={camposDoFiltro}
        chavesComErro={errosDeFiltro}
        comValor={comValor}
        estado={estado}
        nomePorId={nomePorId}
        onOrdem={escolherOrdem}
        ordem={ordem}
        usuarios={usuarios}
      />

      <p
        className={
          aviso || state?.aviso ? 'mb-3 border border-border px-3 py-2 text-sm' : 'sr-only'
        }
        role="status"
      >
        {aviso ?? state?.aviso}
      </p>
      <ApiErrorAlert
        className="mb-3"
        error={erroAoMover}
        id="quadro-mover-erro"
        title="Não foi possível mover o card"
      />

      {conteudo}

      <CamposObrigatoriosDialog
        campos={campos}
        onFechar={() => setPendencia(null)}
        onMover={({ card, de, destino }, extras) =>
          mover.mutateAsync({ card, de, para: destino.ref, ...extras })
        }
        onRecusado={(erro) => setPendencia((atual) => atual && { ...atual, erro })}
        onSalvo={(texto) => {
          setPendencia(null);
          setAviso(texto);
        }}
        pendencia={pendencia}
      />
      <NovoCardDialog
        campos={campos}
        coluna={adicionandoEm}
        onFechar={() => setAdicionandoEm(null)}
        onSalvo={setAviso}
        quadroRef={quadroRef}
      />

      <Outlet context={{ baseDoLead: base }} />
    </>
  );
}
