/**
 * @file Um Sheet por lead (`key`): ir de um lead a outro sem fechar (ex.: "Abrir o existente"
 * no 409 de duplicidade) recomeça o estado do zero.
 */
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useParams } from 'react-router-dom';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { FormSkeleton } from '@/components/loading-skeletons';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { podeVer, temFeature } from '@/lib/acesso';
import { toApiError } from '@/services/api';

import { AVISOS_LEAD, CRM_FEATURES, PAPEIS_GESTAO } from '../constants';
import { useContextoDoForm } from '../hooks/use-contexto-do-form';
import { useLayoutEfetivo } from '../hooks/use-layout';
import { useLead } from '../hooks/use-lead';
import {
  useArquivarLead,
  useAtualizarLead,
  useCriarLead,
  useDesarquivarLead,
} from '../hooks/use-lead-mutations';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { useUsuarios } from '../hooks/use-usuarios';
import {
  montarPayloadCriacao,
  montarPayloadEdicao,
  payloadVazio,
  versaoDoLead,
} from '../lib/form-lead';
import { versaoDoConflito } from '../lib/oportunidades';
import { avisoDeProbabilidade, juntarAvisos } from '../lib/probabilidade';
import { crmKeys } from '../query-keys';
import { ID_BOTAO_NOVO_LEAD, ID_NOVO_LEAD, idLinkDoLead } from '../rotas';
import { AnonimizarLeadDialog } from './anonimizar-lead-dialog';
import { ConfirmarArquivarDialog } from './confirmar-arquivar-dialog';
import { ExcluirLeadDialog } from './excluir-lead-dialog';
import { LeadAbas } from './lead-abas';
import { LeadCabecalho } from './lead-cabecalho';
import { LeadForm } from './lead-form';

function Carregando() {
  return (
    <div className="px-4 py-2">
      <FormSkeleton fields={6} label="Carregando lead…" />
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
  const comFormularios = temFeature(user, CRM_FEATURES.FORMULARIOS);
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);

  const [aberto, setAberto] = useState(true);
  const [editando, setEditando] = useState(Boolean(location.state?.editar));
  const [excluindo, setExcluindo] = useState(false);
  const [anonimizando, setAnonimizando] = useState(false);
  // Com `crm.formularios` (FM6), arquivar confirma antes: cancela os links ativos.
  const [confirmandoArquivo, setConfirmandoArquivo] = useState(false);
  const [aviso, setAviso] = useState(null);
  // Versão que o form edita: uma recarga em segundo plano não pode trocá-la.
  const [versaoLida, setVersaoLida] = useState(undefined);
  const [maisNovo, setMaisNovo] = useState(null);
  const [formAtual, setFormAtual] = useState(0);
  const avisoDaListaRef = useRef(undefined);
  const queryClient = useQueryClient();

  const { voltarParaLista, abrirLead } = useNavegacaoLeads();
  const leadQuery = useLead(criando ? undefined : leadId);
  const lead = leadQuery.data;
  const { camposQuery, campos, iniciais, avaliarRegras, comLgpd, distribuicaoLigada, esperando } =
    useContextoDoForm({ criando, lead });
  const { usuarios, nomePorId } = useUsuarios();
  const layout = useLayoutEfetivo();
  const criar = useCriarLead();
  const atualizar = useAtualizarLead(leadId);
  const arquivar = useArquivarLead();
  const desarquivar = useDesarquivarLead();

  // Lead anonimizado (LGPD): não edita nem mescla (o back daria 409).
  const anonimizado = Boolean(lead?.anonimizado_em);

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
    // Mudar o status volta a probabilidade ao padrão (FC1). O lead não traz a
    // efetiva, então a frase sai sem o número novo.
    let avisoDaProbabilidade = null;

    if (!payloadVazio(payload)) {
      const expectedUpdatedAt = versaoLida ?? versaoDoLead(lead);

      try {
        const salvo = await atualizar.mutateAsync({ ...payload, ...extra, expectedUpdatedAt });

        avisoDaProbabilidade = avisoDeProbabilidade(salvo.avisos);
      } catch (error) {
        const atual = versaoDoConflito(toApiError(error));

        if (!atual) {
          throw error;
        }

        setMaisNovo(atual);

        return;
      }
    }

    setEditando(false);
    setAviso(payloadVazio(payload) ? null : juntarAvisos(AVISOS_LEAD.SALVO, avisoDaProbabilidade));
  }

  /** O rascunho só se perde aqui, no clique: o form remonta sobre o lead atual. */
  function carregarVersaoAtual() {
    queryClient.setQueryData(crmKeys.lead(leadId), maisNovo);
    setVersaoLida(versaoDoLead(maisNovo));
    setMaisNovo(null);
    setFormAtual((atual) => atual + 1);
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
        onArquivar: () =>
          comFormularios
            ? setConfirmandoArquivo(true)
            : mudarArquivo(arquivar, desarquivar, AVISOS_LEAD.ARQUIVADO),
        onDesarquivar: () => mudarArquivo(desarquivar, arquivar, AVISOS_LEAD.DESARQUIVADO),
      }
    : null;
  const erroDeArquivo = arquivar.error ?? desarquivar.error;

  const erro = camposQuery.error ?? leadQuery.error;
  const carregando = esperando || (!criando && leadQuery.isPending);
  const mostrarForm = criando || (editando && !anonimizado);

  return (
    <Sheet
      onOpenChange={(proximo) => !proximo && fechar()}
      onOpenChangeComplete={(proximo) => !proximo && voltarParaLista(avisoDaListaRef.current)}
      open={aberto}
    >
      <SheetContent
        className="w-full gap-0 p-0 sm:max-w-lg"
        // Devolve o foco a quem abriu; se a linha sumiu (exclusão), o padrão.
        finalFocus={() =>
          document.getElementById(
            location.state?.focoAoFechar ?? (criando ? ID_BOTAO_NOVO_LEAD : idLinkDoLead(leadId)),
          ) ?? true
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
            setVersaoLida(versaoDoLead(lead));
            setMaisNovo(null);
            setEditando(true);
          }}
          onAnonimizar={comLgpd && gestao && !anonimizado ? () => setAnonimizando(true) : undefined}
          onExcluir={() => setExcluindo(true)}
        />

        <div className="flex min-h-0 flex-1 flex-col pt-4">
          {aviso && (
            <p
              className="mx-4 mb-4 rounded-lg border border-border bg-surface px-3 py-2 text-sm"
              role="status"
            >
              {aviso}
            </p>
          )}
          {maisNovo && mostrarForm && (
            <div
              className="mx-4 mb-4 grid justify-items-start gap-2 rounded-lg border border-border bg-surface px-3 py-2"
              role="alert"
            >
              <p className="text-sm">Outra pessoa alterou este lead enquanto você editava.</p>
              <Button onClick={carregarVersaoAtual} size="sm" type="button" variant="outline">
                Carregar versão atual
              </Button>
            </div>
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
              key={criando ? ID_NOVO_LEAD : `${leadId}:${formAtual}`}
              avaliarRegras={avaliarRegras}
              comLgpd={comLgpd}
              distribuicaoLigada={distribuicaoLigada}
              leadId={criando ? undefined : leadId}
              modo={criando ? 'criar' : 'editar'}
              onAbrirLead={(id) => abrirLead(id)}
              onCancelar={() => {
                setMaisNovo(null);

                return criando ? fechar() : setEditando(false);
              }}
              onSalvar={salvar}
              optOutDesde={lead?.marketing_opt_out_at ?? null}
              usuarios={usuarios}
            />
          ) : (
            <LeadAbas
              abaInicial={location.state?.aba}
              campos={campos}
              comAtividades={comAtividades}
              comFormularios={comFormularios}
              layout={layout}
              lead={lead}
              nomePorId={nomePorId}
            />
          )}
        </div>
      </SheetContent>

      {confirmandoArquivo && (
        <ConfirmarArquivarDialog
          lead={lead ?? {}}
          onConfirmar={async () => {
            setAviso(null);
            desarquivar.reset();

            try {
              await arquivar.mutateAsync(leadId);
            } catch (error) {
              // O erro aparece no dialog, não também no alerta do drawer.
              arquivar.reset();

              throw new Error(toApiError(error).message, { cause: error });
            }

            setAviso(AVISOS_LEAD.ARQUIVADO);
          }}
          onFechar={() => setConfirmandoArquivo(false)}
        />
      )}
      <ExcluirLeadDialog
        comFormularios={comFormularios}
        comLixeira={comArquivo}
        lead={lead ?? null}
        onExcluido={() => fechar(comArquivo ? AVISOS_LEAD.NA_LIXEIRA : AVISOS_LEAD.EXCLUIDO)}
        onOpenChange={setExcluindo}
        open={excluindo}
      />
      <AnonimizarLeadDialog
        comFormularios={comFormularios}
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
