import { useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { AVISOS_LEAD, CONTEXTO, CRM_FEATURES } from '../constants';
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
import { useRegrasDoForm } from '../hooks/use-regras';
import { useUsuarios } from '../hooks/use-usuarios';
import { camposDoContexto } from '../lib/contextos';
import { avaliarNoForm } from '../lib/regras';
import {
  montarPayloadCriacao,
  montarPayloadEdicao,
  payloadVazio,
  valoresIniciais,
} from '../lib/form-lead';
import { ID_BOTAO_NOVO_LEAD, ID_NOVO_LEAD, idLinkDoLead } from '../rotas';
import { ExcluirLeadDialog } from './excluir-lead-dialog';
import { LeadCabecalho } from './lead-cabecalho';
import { LeadAbas } from './lead-abas';
import { LeadForm } from './lead-form';

const CAMPOS_VAZIOS = [];

function Carregando() {
  return (
    <div className="grid gap-3 px-4" aria-busy="true">
      <span className="sr-only" role="status">Carregando lead…</span>
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

  const [aberto, setAberto] = useState(true);
  const [editando, setEditando] = useState(Boolean(location.state?.editar));
  const [excluindo, setExcluindo] = useState(false);
  const [aviso, setAviso] = useState(null);
  const avisoDaListaRef = useRef(undefined);

  const { voltarParaLista, abrirLead } = useNavegacaoLeads();
  const camposQuery = useCampos();
  const leadQuery = useLead(criando ? undefined : leadId);
  const { usuarios, nomePorId } = useUsuarios();
  const layout = useLayoutEfetivo();
  const regras = useRegrasDoForm();
  const distribuicaoLigada = useDistribuicaoLigada();
  const criar = useCriarLead();
  const atualizar = useAtualizarLead(leadId);
  const arquivar = useArquivarLead();
  const desarquivar = useDesarquivarLead();

  // Criar mostra os campos de "Criação"; ver e editar, os de "Ficha".
  const contexto = criando ? CONTEXTO.CRIACAO : CONTEXTO.FICHA;
  const campos = useMemo(
    () => camposDoContexto(camposQuery.data ?? CAMPOS_VAZIOS, contexto),
    [camposQuery.data, contexto],
  );
  const lead = leadQuery.data;
  const iniciais = useMemo(() => valoresIniciais(campos, lead), [campos, lead]);
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
    if (!payloadVazio(payload)) await atualizar.mutateAsync({ ...payload, ...extra });

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
  const carregando = camposQuery.isPending || (!criando && leadQuery.isPending);
  const mostrarForm = criando || editando;

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
              distribuicaoLigada={distribuicaoLigada}
              leadId={criando ? undefined : leadId}
              modo={criando ? 'criar' : 'editar'}
              onAbrirLead={(id) => abrirLead(id)}
              onCancelar={() => (criando ? fechar() : setEditando(false))}
              onSalvar={salvar}
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
