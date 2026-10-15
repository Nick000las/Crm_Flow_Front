import { Pencil, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { AVISOS_LEAD } from '../constants';
import { useCampos } from '../hooks/use-campos';
import { useLead } from '../hooks/use-lead';
import { useAtualizarLead, useCriarLead } from '../hooks/use-lead-mutations';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { useUsuarios } from '../hooks/use-usuarios';
import {
  montarPayloadCriacao,
  montarPayloadEdicao,
  payloadVazio,
  valoresIniciais,
} from '../lib/form-lead';
import { ID_BOTAO_NOVO_LEAD, ID_NOVO_LEAD, idLinkDoLead } from '../rotas';
import { ExcluirLeadDialog } from './excluir-lead-dialog';
import { LeadDetalhe } from './lead-detalhe';
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
export function LeadSheet() {
  const { leadId } = useParams();
  const location = useLocation();
  const criando = leadId === ID_NOVO_LEAD;

  const [aberto, setAberto] = useState(true);
  const [editando, setEditando] = useState(Boolean(location.state?.editar));
  const [excluindo, setExcluindo] = useState(false);
  const [aviso, setAviso] = useState(null);
  const avisoDaListaRef = useRef(undefined);

  const { voltarParaLista } = useNavegacaoLeads();
  const camposQuery = useCampos();
  const leadQuery = useLead(criando ? undefined : leadId);
  const { usuarios, nomePorId } = useUsuarios();
  const criar = useCriarLead();
  const atualizar = useAtualizarLead(leadId);

  const campos = camposQuery.data ?? CAMPOS_VAZIOS;
  const lead = leadQuery.data;
  const iniciais = useMemo(() => valoresIniciais(campos, lead), [campos, lead]);

  /** Fecha com animação; a navegação acontece quando ela termina. */
  function fechar(avisoDaLista) {
    avisoDaListaRef.current = avisoDaLista;
    setAberto(false);
  }

  async function salvar(valores) {
    if (criando) {
      await criar.mutateAsync(montarPayloadCriacao(campos, valores));
      fechar(AVISOS_LEAD.CRIADO);
      return;
    }

    const payload = montarPayloadEdicao(campos, iniciais, valores);
    if (!payloadVazio(payload)) await atualizar.mutateAsync(payload);

    setEditando(false);
    setAviso(payloadVazio(payload) ? null : AVISOS_LEAD.SALVO);
  }

  const erro = camposQuery.error ?? leadQuery.error;
  const carregando = camposQuery.isPending || (!criando && leadQuery.isPending);
  const titulo = criando ? 'Novo lead' : (lead?.nome ?? 'Lead');
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
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="pr-8">{titulo}</SheetTitle>
          <SheetDescription>
            {criando ? 'Preencha os dados do contato.' : editando ? 'Editando o lead.' : 'Dados do lead.'}
          </SheetDescription>
          {!criando && lead && !editando && (
            <div className="flex gap-2 pt-2">
              <Button onClick={() => { setAviso(null); setEditando(true); }} size="sm" variant="outline">
                <Pencil aria-hidden="true" />
                Editar
              </Button>
              <Button onClick={() => setExcluindo(true)} size="sm" variant="destructive">
                <Trash2 aria-hidden="true" />
                Excluir
              </Button>
            </div>
          )}
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col pt-4">
          {aviso && (
            <p className="mx-4 mb-4 border border-border px-3 py-2 text-sm" role="status">
              {aviso}
            </p>
          )}

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
              modo={criando ? 'criar' : 'editar'}
              onCancelar={() => (criando ? fechar() : setEditando(false))}
              onSalvar={salvar}
              usuarios={usuarios}
            />
          ) : (
            <div className="overflow-y-auto">
              <LeadDetalhe campos={campos} lead={lead} nomePorId={nomePorId} />
            </div>
          )}
        </div>
      </SheetContent>

      <ExcluirLeadDialog
        lead={lead ?? null}
        onExcluido={() => fechar(AVISOS_LEAD.EXCLUIDO)}
        onOpenChange={setExcluindo}
        open={excluindo}
      />
    </Sheet>
  );
}
