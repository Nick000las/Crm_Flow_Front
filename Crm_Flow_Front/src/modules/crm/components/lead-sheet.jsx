import { useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { podeVer, temFeature } from '@/lib/acesso';
import { AVISOS_LEAD, CAMPOS_LGPD, CONTEXTO, CRM_FEATURES, PAPEIS_GESTAO } from '../constants';
import { useCampos } from '../hooks/use-campos';
import { useLayoutEfetivo } from '../hooks/use-layout';
import { useLead } from '../hooks/use-lead';
import {
  useArquivarLead,
  useAtualizarLead,
  useCriarLead,
  useDesarquivarLead,
} from '../hooks/use-lead-mutations';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { useDistribuicaoLigada } from '../hooks/use-distribuicao';
import { useConfigLgpd } from '../hooks/use-lgpd';
import { useRegrasDoForm } from '../hooks/use-regras';
import { useUsuarios } from '../hooks/use-usuarios';
import { camposDoContexto } from '../lib/contextos';
import { avaliarNoForm } from '../lib/regras';
import {
  marcarCalculados,
  montarPayloadCriacao,
  montarPayloadEdicao,
  payloadVazio,
  valoresIniciais,
} from '../lib/form-lead';
import { ID_BOTAO_NOVO_LEAD, ID_NOVO_LEAD, idLinkDoLead } from '../rotas';
import { ExcluirLeadDialog } from './excluir-lead-dialog';
import { AnonimizarLeadDialog } from './anonimizar-lead-dialog';
import { LeadCabecalho } from './lead-cabecalho';
import { LeadAbas } from './lead-abas';
import { LeadForm } from './lead-form';

const CAMPOS_VAZIOS = [];

function Carregando() {
  return (
    <div className="grid gap-3 px-4" aria-busy="true">
      <span className="sr-only" role="status">
        Carregando lead…
      </span>
      {Array.from({ length: 6 }, (_, indice) => (
        <Skeleton className="h-8 rounded-none" key={indice} />
      ))}
    </div>
  );
}

/**
 * Sheet do lead, aberto pela rota `/crm/leads/:leadId` sobre a lista — dá
 * link direto e não perde o contexto. `novo` cria; um id mostra o detalhe,
 * que alterna para edição no mesmo Sheet.
 */
function SheetDoLead({ leadId }) {
  const location = useLocation();
  const criando = leadId === ID_NOVO_LEAD;
  const { user } = useAuth();
  const comArquivo = temFeature(user, CRM_FEATURES.ARQUIVO);
  const comAtividades = temFeature(user, CRM_FEATURES.ATIVIDADES);
  const comLgpd = temFeature(user, CRM_FEATURES.LGPD);
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);

  const [aberto, setAberto] = useState(true);
  const [editando, setEditando] = useState(Boolean(location.state?.editar));
  const [excluindo, setExcluindo] = useState(false);
  const [anonimizando, setAnonimizando] = useState(false);
  const [aviso, setAviso] = useState(null);
  const avisoDaListaRef = useRef(undefined);

  const { voltarParaLista, abrirLead } = useNavegacaoLeads();
  const camposQuery = useCampos();
  const leadQuery = useLead(criando ? undefined : leadId);
  const { usuarios, nomePorId } = useUsuarios();
  const layout = useLayoutEfetivo();
  const regras = useRegrasDoForm();
  const distribuicaoLigada = useDistribuicaoLigada();
  const lgpdQuery = useConfigLgpd();
  const criar = useCriarLead();
  const atualizar = useAtualizarLead(leadId);
  const arquivar = useArquivarLead();
  const desarquivar = useDesarquivarLead();

  // Criar mostra os campos de "Criação"; ver e editar, os de "Ficha".
  const contexto = criando ? CONTEXTO.CRIACAO : CONTEXTO.FICHA;
  // Com `crm.score`, o Lead score é calculado: travado no form e fora do payload.
  const comScore = temFeature(user, CRM_FEATURES.SCORE);
  const campos = useMemo(
    () => marcarCalculados(camposDoContexto(camposQuery.data ?? CAMPOS_VAZIOS, contexto), comScore),
    [camposQuery.data, contexto, comScore],
  );
  const lead = leadQuery.data;
  // LGPD: na criação, a base legal padrão do tenant já vem escolhida.
  const basePadrao = criando ? (lgpdQuery.data?.basePadrao ?? null) : null;
  const iniciais = useMemo(
    () =>
      valoresIniciais(
        campos,
        lead,
        basePadrao ? { [CAMPOS_LGPD.BASE_LEGAL]: basePadrao } : undefined,
      ),
    [campos, lead, basePadrao],
  );
  // Lead anonimizado (LGPD): não edita nem mescla (o back daria 409).
  const anonimizado = Boolean(lead?.anonimizado_em);
  // Regras de campo: com todos os campos de `/fields`, porque a condição pode
  // estar num campo fora do contexto do form. Sem a flag, `undefined`.
  const todosCampos = camposQuery.data ?? CAMPOS_VAZIOS;
  const avaliarRegras = regras
    ? (valores) => avaliarNoForm(regras, todosCampos, criando ? undefined : lead, campos, valores)
    : undefined;

  /** Fecha com animação; a navegação acontece quando ela termina. */
  function fechar(avisoDaLista) {
    avisoDaListaRef.current = avisoDaLista;
    setAberto(false);
  }

  /**
   * `ignorarDuplicados` vem do "Salvar mesmo assim" (409 de aviso): a
   * mesma requisição de novo, com a flag.
   */
  async function salvar(valores, { ignorarDuplicados = false } = {}) {
    const extra = ignorarDuplicados ? { ignorarDuplicados: true } : {};

    if (criando) {
      await criar.mutateAsync({ ...montarPayloadCriacao(campos, valores), ...extra });
      fechar(AVISOS_LEAD.CRIADO);
      return;
    }

    const payload = montarPayloadEdicao(campos, iniciais, valores);
    if (!payloadVazio(payload)) {
      await atualizar.mutateAsync({ ...payload, ...extra });
    }

    setEditando(false);
    setAviso(payloadVazio(payload) ? null : AVISOS_LEAD.SALVO);
  }

  /** Arquivar/desarquivar não fecha o drawer: o selo troca e o aviso serve de desfazer. */
  function mudarArquivo(mutacao, outra, avisoDeSucesso) {
    setAviso(null);
    outra.reset();
    mutacao.mutate(leadId, { onSuccess: () => setAviso(avisoDeSucesso) });
  }

  const arquivo = comArquivo
    ? {
        ocupado: arquivar.isPending || desarquivar.isPending,
        onArquivar: () => mudarArquivo(arquivar, desarquivar, AVISOS_LEAD.ARQUIVADO),
        onDesarquivar: () => mudarArquivo(desarquivar, arquivar, AVISOS_LEAD.DESARQUIVADO),
      }
    : null;
  const erroDeArquivo = arquivar.error ?? desarquivar.error;

  const erro = camposQuery.error ?? leadQuery.error;
  // Criando com `crm.lgpd`: espera a configuração, para a base padrão entrar no form.
  const carregando =
    camposQuery.isPending ||
    (!criando && leadQuery.isPending) ||
    (criando && comLgpd && lgpdQuery.isPending);
  const mostrarForm = criando || (editando && !anonimizado);

  return (
    <Sheet
      onOpenChange={(proximo) => !proximo && fechar()}
      onOpenChangeComplete={(proximo) => !proximo && voltarParaLista(avisoDaListaRef.current)}
      open={aberto}
    >
      <SheetContent
        className="w-full gap-0 rounded-none p-0 shadow-none sm:max-w-lg"
        // Devolve o foco a quem abriu; se a linha sumiu (exclusão), o padrão.
        finalFocus={() =>
          document.getElementById(criando ? ID_BOTAO_NOVO_LEAD : idLinkDoLead(leadId)) ?? true
        }
      >
        <LeadCabecalho
          arquivo={arquivo}
          criando={criando}
          editando={editando}
          layout={layout}
          lead={lead}
          nomePorId={nomePorId}
          onEditar={() => {
            setAviso(null);
            arquivar.reset();
            desarquivar.reset();
            setEditando(true);
          }}
          onAnonimizar={comLgpd && gestao && !anonimizado ? () => setAnonimizando(true) : undefined}
          onExcluir={() => setExcluindo(true)}
        />

        <div className="flex min-h-0 flex-1 flex-col pt-4">
          {aviso && (
            <p className="mx-4 mb-4 border border-border px-3 py-2 text-sm" role="status">
              {aviso}
            </p>
          )}
          <ApiErrorAlert
            className="mx-4 mb-4"
            error={erroDeArquivo}
            id="lead-sheet-arquivo-erro"
            title="Não foi possível mudar o arquivo do lead"
          />

          {erro ? (
            <ApiErrorAlert className="mx-4" error={erro} id="lead-sheet-erro" />
          ) : carregando ? (
            <Carregando />
          ) : mostrarForm ? (
            <LeadForm
              campos={campos}
              enviando={criar.isPending || atualizar.isPending}
              iniciais={iniciais}
              key={criando ? ID_NOVO_LEAD : leadId}
              avaliarRegras={avaliarRegras}
              comLgpd={comLgpd}
              distribuicaoLigada={distribuicaoLigada}
              leadId={criando ? undefined : leadId}
              modo={criando ? 'criar' : 'editar'}
              onAbrirLead={(id) => abrirLead(id)}
              onCancelar={() => (criando ? fechar() : setEditando(false))}
              onSalvar={salvar}
              optOutDesde={lead?.marketing_opt_out_at ?? null}
              usuarios={usuarios}
            />
          ) : (
            <LeadAbas
              campos={campos}
              comAtividades={comAtividades}
              layout={layout}
              lead={lead}
              nomePorId={nomePorId}
            />
          )}
        </div>
      </SheetContent>

      <ExcluirLeadDialog
        comLixeira={comArquivo}
        lead={lead ?? null}
        onExcluido={() => fechar(comArquivo ? AVISOS_LEAD.NA_LIXEIRA : AVISOS_LEAD.EXCLUIDO)}
        onOpenChange={setExcluindo}
        open={excluindo}
      />
      <AnonimizarLeadDialog
        lead={anonimizando ? (lead ?? null) : null}
        onAnonimizado={(texto) => {
          setEditando(false);
          setAviso(texto);
        }}
        onOpenChange={setAnonimizando}
      />
    </Sheet>
  );
}

/**
 * Um Sheet por lead (`key`): ir de um lead a outro sem fechar (ex.: "Abrir o
 * existente" no 409 de duplicidade) recomeça o estado do zero.
 */
export function LeadSheet() {
  const { leadId } = useParams();

  return <SheetDoLead key={leadId} leadId={leadId} />;
}
