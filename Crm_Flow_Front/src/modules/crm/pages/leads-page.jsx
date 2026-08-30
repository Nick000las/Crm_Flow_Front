import { Download, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { PageHeader } from '@/components/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { podeVer, temFeature } from '@/lib/acesso';
import { isAccessError } from '@/services/api';
import { AbasSituacao } from '../components/abas-situacao';
import { AnonimizarLeadDialog } from '../components/anonimizar-lead-dialog';
import { BarraSelecao } from '../components/barra-selecao';
import { EditarEmMassaDialog } from '../components/editar-em-massa-dialog';
import { ChipsFiltro } from '../components/chips-filtro';
import { ExcluirLeadDialog } from '../components/excluir-lead-dialog';
import { ExportarDialog } from '../components/exportar-dialog';
import { LeadsToolbar } from '../components/leads-toolbar';
import { LeadsConteudo } from '../components/leads-conteudo';
import { MesclarDialog } from '../components/mesclagem/mesclar-dialog';
import {
  AVISOS_LEAD,
  BULK,
  CONTEXTO,
  CRM_FEATURES,
  PAPEIS_GESTAO,
  SITUACOES_LEAD,
} from '../constants';
import { useAcoesDeArquivo } from '../hooks/use-acoes-de-arquivo';
import { useCampos } from '../hooks/use-campos';
import { useColunasDaLista } from '../hooks/use-colunas-da-lista';
import { useEstadoLista } from '../hooks/use-estado-lista';
import { useLeadsSearch } from '../hooks/use-leads-search';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { useSelecaoLeads } from '../hooks/use-selecao-leads';
import { useUsuarios } from '../hooks/use-usuarios';
import { useFaixasScore } from '../hooks/use-score';
import { situacaoDaBusca } from '../lib/arquivo';
import { filtroDaBusca } from '../lib/inatividade';
import { filtroComScore } from '../lib/score';
import { avisoDoResultado } from '../lib/massa';
import { camposDoContexto } from '../lib/contextos';
import { placeholderDaBusca } from '../lib/layout';
import { FILTRO_VAZIO, chavesComErro, chavesForaDosCampos, chipsDoFiltro } from '../lib/filtro';
import { ID_BOTAO_NOVO_LEAD } from '../rotas';

const CAMPOS_VAZIOS = [];
/** Sem `crm.massa`, a seleção serve só para mesclar. */
const MAXIMO_MESCLAR = 2;

/**
 * Lista de leads. O Sheet de detalhe/criação é rota filha (`<Outlet />`):
 * abre sobre a lista sem desmontá-la. Com `crm.arquivo`, abas de situação
 * (Ativos · Arquivados · Lixeira) e ações de arquivo na linha.
 */
export default function LeadsPage() {
  const { user } = useAuth();
  const { state } = useLocation();
  const { estado: estadoDaUrl, atualizar } = useEstadoLista();
  const comArquivo = temFeature(user, CRM_FEATURES.ARQUIVO);
  // Sem a flag, um link ou view da lixeira cai em "ativos" (o back daria 403).
  const situacao = situacaoDaBusca(estadoDaUrl.situacao, comArquivo);
  // Sem `crm.inatividade`, o "esfriando" de um link ou view antiga sai (idem).
  const comInatividade = temFeature(user, CRM_FEATURES.INATIVIDADE);
  const comScore = temFeature(user, CRM_FEATURES.SCORE);
  const estado = useMemo(
    () => ({
      ...estadoDaUrl,
      situacao,
      filtro: filtroComScore(filtroDaBusca(estadoDaUrl.filtro, comInatividade), comScore),
    }),
    [estadoDaUrl, situacao, comInatividade, comScore],
  );
  const naLixeira = situacao === SITUACOES_LEAD.LIXEIRA;
  const { destinos, abrirLead, voltarParaLista } = useNavegacaoLeads();
  const camposQuery = useCampos();
  const leadsQuery = useLeadsSearch(estado);
  const arquivo = useAcoesDeArquivo(voltarParaLista);
  const { usuarios, nomePorId } = useUsuarios();
  const [leadAExcluir, setLeadAExcluir] = useState(null);
  const [aAnonimizar, setAAnonimizar] = useState(null);
  const [avisoAnonimizar, setAvisoAnonimizar] = useState(null);
  const [exportando, setExportando] = useState(false);
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);
  // Mesclar: DONO/MASTER com `crm.duplicidade`, fora da lixeira.
  const podeMesclar = gestao && temFeature(user, CRM_FEATURES.DUPLICIDADE) && !naLixeira;
  // Anonimizar (LGPD): DONO/MASTER com `crm.lgpd`, em qualquer aba (inclusive a lixeira).
  const podeAnonimizar = gestao && temFeature(user, CRM_FEATURES.LGPD);
  // Edição em massa: qualquer papel com `crm.massa`, fora da lixeira (lá o back dá 404).
  const emMassa = temFeature(user, CRM_FEATURES.MASSA) && !naLixeira;
  const chaveDaConsulta = JSON.stringify([
    estado.busca,
    estado.filtro,
    situacao,
    estado.pagina,
    estado.tamanho,
  ]);
  const selecao = useSelecaoLeads(chaveDaConsulta, emMassa ? BULK.MAX_IDS : MAXIMO_MESCLAR);
  const [aMesclar, setAMesclar] = useState([]);
  const [editandoEmMassa, setEditandoEmMassa] = useState(false);
  const [resultadoMassa, setResultadoMassa] = useState(null);
  const [avisoMassa, setAvisoMassa] = useState(null);

  // Uma chamada para a lista toda; cada parte recebe os campos da sua tela.
  // Chips e export usam todos: um filtro antigo por campo fora de "Filtros"
  // ainda precisa do rótulo (o back o recusa com 400, destacado no chip).
  const campos = camposQuery.data ?? CAMPOS_VAZIOS;
  const camposDoFiltro = useMemo(() => camposDoContexto(campos, CONTEXTO.FILTRO), [campos]);
  const { identificador, colunas, ids, visiveis, alternar } = useColunasDaLista(
    campos,
    user?.tenantId,
  );

  const erro = camposQuery.error ?? leadsQuery.error;
  const pagina = leadsQuery.data;
  // Um 400 de filtro (`filtros.<chave>`) destaca o chip e a linha do construtor.
  const errosDeFiltro = useMemo(() => chavesComErro(leadsQuery.error?.fields), [leadsQuery.error]);
  // Filtro por campo que este usuário não vê (permissão por campo): aviso próprio.
  const ocultosNoFiltro = useMemo(
    () => (camposQuery.data ? chavesForaDosCampos(leadsQuery.error?.fields, camposQuery.data) : []),
    [leadsQuery.error, camposQuery.data],
  );
  const faixasScore = useFaixasScore();
  const chips = useMemo(
    () => chipsDoFiltro(estado.filtro, campos, nomePorId, faixasScore),
    [estado.filtro, campos, nomePorId, faixasScore],
  );
  // Confirmação breve de salvar/excluir. Chega pelo state da navegação, então
  // some sozinha na próxima navegação (troca de página, busca).
  // O da edição em massa vale só para a consulta em que foi feita.
  const aviso =
    (avisoMassa?.chave === chaveDaConsulta && avisoMassa.texto) ||
    (avisoAnonimizar?.chave === chaveDaConsulta && avisoAnonimizar.texto) ||
    state?.aviso;

  /** Ao fechar o dialog (por qualquer caminho): só as falhas seguem marcadas. */
  function fecharEdicaoEmMassa() {
    setEditandoEmMassa(false);
    if (!resultadoMassa) {
      return;
    }

    const falhas = resultadoMassa.resultados
      .filter((resultado) => !resultado.ok)
      .map((resultado) => resultado.id);
    if (falhas.length > 0) {
      selecao.manter(falhas);
    } else {
      selecao.limpar();
    }
    setAvisoMassa({ chave: chaveDaConsulta, texto: avisoDoResultado(resultadoMassa) });
    setResultadoMassa(null);
  }

  const botaoNovo = (comId) => (
    // Só o do cabeçalho leva o id: é ele que recebe o foco de volta.
    <Link
      className={buttonVariants()}
      id={comId ? ID_BOTAO_NOVO_LEAD : undefined}
      to={destinos.novo}
    >
      <Plus aria-hidden="true" />
      Novo lead
    </Link>
  );

  const acoesDoCabecalho = (
    <>
      {/* A lixeira não se exporta (o back dá 400). */}
      {gestao && !naLixeira && (
        <Button onClick={() => setExportando(true)} variant="outline">
          <Download aria-hidden="true" />
          Exportar
        </Button>
      )}
      {botaoNovo(true)}
    </>
  );

  const lista = (
    <>
      <LeadsToolbar
        atualizar={atualizar}
        campos={camposDoFiltro}
        chavesComErro={errosDeFiltro}
        colunas={colunas}
        colunasSelecionadas={ids}
        estado={estado}
        onAlternarColuna={alternar}
        placeholderBusca={placeholderDaBusca(identificador)}
        total={pagina?.total}
        usuarios={usuarios}
      />
      <ChipsFiltro
        chavesComErro={errosDeFiltro}
        chips={chips}
        onLimpar={() => atualizar({ filtro: FILTRO_VAZIO, pagina: 1 })}
        onRemover={(chip) => atualizar({ filtro: chip.remover(), pagina: 1 })}
      />

      <p
        className={aviso ? 'mb-4 border border-border px-3 py-2 text-sm' : 'sr-only'}
        role="status"
      >
        {aviso}
      </p>
      <ApiErrorAlert
        className="mb-4"
        error={arquivo.erro}
        id="crm-leads-arquivo-erro"
        title="Não foi possível mudar o lead"
      />

      {(emMassa || podeMesclar) && (
        <BarraSelecao
          onEditarEmMassa={emMassa ? () => setEditandoEmMassa(true) : undefined}
          onLimpar={selecao.limpar}
          bloqueioMesclar={
            selecao.leads.some((lead) => lead.anonimizado_em)
              ? 'Lead anonimizado não pode ser mesclado.'
              : null
          }
          onMesclar={podeMesclar ? () => setAMesclar(selecao.leads) : undefined}
          total={selecao.leads.length}
        />
      )}

      <LeadsConteudo
        acoesDeArquivo={comArquivo ? arquivo.acoes : undefined}
        onAnonimizar={podeAnonimizar ? setAAnonimizar : undefined}
        onMesclar={podeMesclar ? (lead) => setAMesclar([lead]) : undefined}
        selecao={emMassa || podeMesclar ? selecao.tabela : null}
        atualizar={atualizar}
        botaoNovo={botaoNovo(false)}
        carregando={camposQuery.isPending || leadsQuery.isPending}
        colunas={visiveis}
        erro={erro}
        estado={estado}
        identificador={identificador}
        leadsQuery={leadsQuery}
        nomePorId={nomePorId}
        ocultosNoFiltro={ocultosNoFiltro}
        onAbrir={abrirLead}
        onExcluir={setLeadAExcluir}
        podeImportar={gestao}
        situacao={situacao}
      />
    </>
  );

  if (isAccessError(erro)) {
    return (
      <>
        <PageHeader title="Leads" description="Contatos e oportunidades do CRM." />
        <AcessoIndisponivel error={erro} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        actions={acoesDoCabecalho}
        title="Leads"
        description="Contatos e oportunidades do CRM."
      />
      {comArquivo ? (
        <AbasSituacao
          onChange={(proxima) => {
            arquivo.limparErro();
            atualizar({ situacao: proxima, pagina: 1 });
          }}
          situacao={situacao}
        >
          {lista}
        </AbasSituacao>
      ) : (
        lista
      )}

      {podeMesclar && (
        <MesclarDialog
          campos={campos}
          leads={aMesclar}
          nomePorId={nomePorId}
          onMesclado={(principalId) => {
            setAMesclar([]);
            selecao.limpar();
            abrirLead(principalId, { aviso: AVISOS_LEAD.MESCLADO });
          }}
          onOpenChange={(aberto) => !aberto && setAMesclar([])}
        />
      )}

      {emMassa && (
        <EditarEmMassaDialog
          campos={campos}
          identificador={identificador}
          leads={selecao.leads}
          onOpenChange={(aberto) => (aberto ? setEditandoEmMassa(true) : fecharEdicaoEmMassa())}
          onResultado={setResultadoMassa}
          open={editandoEmMassa}
          usuarios={usuarios}
        />
      )}

      {podeAnonimizar && (
        <AnonimizarLeadDialog
          lead={aAnonimizar}
          onAnonimizado={(texto) => setAvisoAnonimizar({ chave: chaveDaConsulta, texto })}
          onOpenChange={(aberto) => !aberto && setAAnonimizar(null)}
        />
      )}

      <ExcluirLeadDialog
        comLixeira={comArquivo}
        lead={leadAExcluir}
        onExcluido={() =>
          voltarParaLista(comArquivo ? AVISOS_LEAD.NA_LIXEIRA : AVISOS_LEAD.EXCLUIDO)
        }
        onOpenChange={(aberto) => !aberto && setLeadAExcluir(null)}
        open={Boolean(leadAExcluir)}
      />

      {gestao && (
        <ExportarDialog
          busca={estado.busca}
          campos={campos}
          comMassa={temFeature(user, CRM_FEATURES.MASSA)}
          filtro={estado.filtro}
          idsVisiveis={ids}
          onOpenChange={setExportando}
          open={exportando}
          situacao={situacao}
        />
      )}

      <Outlet />
    </>
  );
}
