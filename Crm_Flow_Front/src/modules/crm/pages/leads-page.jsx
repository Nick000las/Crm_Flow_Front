import { Download, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/page-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { ChipsFiltro } from '../components/chips-filtro';
import { ExcluirLeadDialog } from '../components/excluir-lead-dialog';
import { ExportarDialog } from '../components/exportar-dialog';
import { LeadsToolbar } from '../components/leads-toolbar';
import { LeadsConteudo } from '../components/leads-conteudo';
import { CrmNaoContratado } from '../components/leads-vazio';
import { AVISOS_LEAD, PAPEIS_GESTAO } from '../constants';
import { useCampos } from '../hooks/use-campos';
import { useColunasVisiveis } from '../hooks/use-colunas-visiveis';
import { useEstadoLista } from '../hooks/use-estado-lista';
import { useLeadsSearch } from '../hooks/use-leads-search';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { useUsuarios } from '../hooks/use-usuarios';
import { montarColunas } from '../lib/colunas';
import { FILTRO_VAZIO, chavesComErro, chipsDoFiltro } from '../lib/filtro';
import { ID_BOTAO_NOVO_LEAD } from '../rotas';

const CAMPOS_VAZIOS = [];

/**
 * Lista de leads. O Sheet de detalhe/criação é rota filha (`<Outlet />`):
 * abre sobre a lista sem desmontá-la.
 */
export default function LeadsPage() {
  const { user } = useAuth();
  const { state } = useLocation();
  const { estado, atualizar } = useEstadoLista();
  const { destinos, abrirLead, voltarParaLista } = useNavegacaoLeads();
  const camposQuery = useCampos();
  const leadsQuery = useLeadsSearch(estado);
  const { usuarios, nomePorId } = useUsuarios();
  const [leadAExcluir, setLeadAExcluir] = useState(null);
  const [exportando, setExportando] = useState(false);
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);

  const colunas = useMemo(() => montarColunas(camposQuery.data ?? CAMPOS_VAZIOS), [camposQuery.data]);
  const { ids, visiveis, alternar } = useColunasVisiveis(user?.tenantId, colunas);

  const campos = camposQuery.data ?? CAMPOS_VAZIOS;
  const erro = camposQuery.error ?? leadsQuery.error;
  const pagina = leadsQuery.data;
  // Um 400 de filtro (`filtros.<chave>`) destaca o chip e a linha do construtor.
  const errosDeFiltro = useMemo(() => chavesComErro(leadsQuery.error?.fields), [leadsQuery.error]);
  const chips = useMemo(
    () => chipsDoFiltro(estado.filtro, campos, nomePorId),
    [estado.filtro, campos, nomePorId],
  );
  // Confirmação breve de salvar/excluir. Chega pelo state da navegação, então
  // some sozinha na próxima navegação (troca de página, busca).
  const aviso = state?.aviso;

  const botaoNovo = (comId) => (
    // Só o do cabeçalho leva o id: é ele que recebe o foco de volta.
    <Link className={buttonVariants()} id={comId ? ID_BOTAO_NOVO_LEAD : undefined} to={destinos.novo}>
      <Plus aria-hidden="true" />
      Novo lead
    </Link>
  );

  const acoesDoCabecalho = (
    <>
      {gestao && (
        <Button onClick={() => setExportando(true)} variant="outline">
          <Download aria-hidden="true" />
          Exportar
        </Button>
      )}
      {botaoNovo(true)}
    </>
  );

  if (erro?.code === 'MODULE_NOT_ENABLED') {
    return (
      <>
        <PageHeader title="Leads" description="Contatos e oportunidades do CRM." />
        <CrmNaoContratado />
      </>
    );
  }

  return (
    <>
      <PageHeader actions={acoesDoCabecalho} title="Leads" description="Contatos e oportunidades do CRM." />

      <LeadsToolbar
        atualizar={atualizar}
        campos={campos}
        chavesComErro={errosDeFiltro}
        colunas={colunas}
        colunasSelecionadas={ids}
        estado={estado}
        onAlternarColuna={alternar}
        total={pagina?.total}
        usuarios={usuarios}
      />
      <ChipsFiltro
        chavesComErro={errosDeFiltro}
        chips={chips}
        onLimpar={() => atualizar({ filtro: FILTRO_VAZIO, pagina: 1 })}
        onRemover={(chip) => atualizar({ filtro: chip.remover(), pagina: 1 })}
      />

      <p className={aviso ? 'mb-4 border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>

      <LeadsConteudo
        atualizar={atualizar}
        botaoNovo={botaoNovo(false)}
        carregando={camposQuery.isPending || leadsQuery.isPending}
        colunas={visiveis}
        erro={erro}
        estado={estado}
        leadsQuery={leadsQuery}
        nomePorId={nomePorId}
        onAbrir={abrirLead}
        onExcluir={setLeadAExcluir}
        podeImportar={gestao}
      />

      <ExcluirLeadDialog
        lead={leadAExcluir}
        onExcluido={() => voltarParaLista(AVISOS_LEAD.EXCLUIDO)}
        onOpenChange={(aberto) => !aberto && setLeadAExcluir(null)}
        open={Boolean(leadAExcluir)}
      />

      {gestao && (
        <ExportarDialog
          busca={estado.busca}
          campos={campos}
          filtro={estado.filtro}
          idsVisiveis={ids}
          onOpenChange={setExportando}
          open={exportando}
        />
      )}

      <Outlet />
    </>
  );
}
