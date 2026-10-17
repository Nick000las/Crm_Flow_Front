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
import { ChipsFiltro } from '../components/chips-filtro';
import { ExcluirLeadDialog } from '../components/excluir-lead-dialog';
import { ExportarDialog } from '../components/exportar-dialog';
import { LeadsToolbar } from '../components/leads-toolbar';
import { LeadsConteudo } from '../components/leads-conteudo';
import { AVISOS_LEAD, CONTEXTO, CRM_FEATURES, PAPEIS_GESTAO, SITUACOES_LEAD } from '../constants';
import { useAcoesDeArquivo } from '../hooks/use-acoes-de-arquivo';
import { useCampos } from '../hooks/use-campos';
import { useColunasDaLista } from '../hooks/use-colunas-da-lista';
import { useEstadoLista } from '../hooks/use-estado-lista';
import { useLeadsSearch } from '../hooks/use-leads-search';
import { useNavegacaoLeads } from '../hooks/use-navegacao-leads';
import { useUsuarios } from '../hooks/use-usuarios';
import { situacaoDaBusca } from '../lib/arquivo';
import { camposDoContexto } from '../lib/contextos';
import { placeholderDaBusca } from '../lib/layout';
import { FILTRO_VAZIO, chavesComErro, chipsDoFiltro } from '../lib/filtro';
import { ID_BOTAO_NOVO_LEAD } from '../rotas';

const CAMPOS_VAZIOS = [];

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
  const estado = useMemo(() => ({ ...estadoDaUrl, situacao }), [estadoDaUrl, situacao]);
  const naLixeira = situacao === SITUACOES_LEAD.LIXEIRA;
  const { destinos, abrirLead, voltarParaLista } = useNavegacaoLeads();
  const camposQuery = useCampos();
  const leadsQuery = useLeadsSearch(estado);
  const arquivo = useAcoesDeArquivo(voltarParaLista);
  const { usuarios, nomePorId } = useUsuarios();
  const [leadAExcluir, setLeadAExcluir] = useState(null);
  const [exportando, setExportando] = useState(false);
  const gestao = podeVer({ roles: PAPEIS_GESTAO }, user);

  // Uma chamada para a lista toda; cada parte recebe os campos da sua tela.
  // Chips e export usam todos: um filtro antigo por campo fora de "Filtros"
  // ainda precisa do rótulo (o back o recusa com 400, destacado no chip).
  const campos = camposQuery.data ?? CAMPOS_VAZIOS;
  const camposDoFiltro = useMemo(() => camposDoContexto(campos, CONTEXTO.FILTRO), [campos]);
  const { identificador, colunas, ids, visiveis, alternar } = useColunasDaLista(campos, user?.tenantId);

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

      <p className={aviso ? 'mb-4 border border-border px-3 py-2 text-sm' : 'sr-only'} role="status">
        {aviso}
      </p>
      <ApiErrorAlert
        className="mb-4"
        error={arquivo.erro}
        id="crm-leads-arquivo-erro"
        title="Não foi possível mudar o lead"
      />

      <LeadsConteudo
        acoesDeArquivo={comArquivo ? arquivo.acoes : undefined}
        atualizar={atualizar}
        botaoNovo={botaoNovo(false)}
        carregando={camposQuery.isPending || leadsQuery.isPending}
        colunas={visiveis}
        erro={erro}
        estado={estado}
        identificador={identificador}
        leadsQuery={leadsQuery}
        nomePorId={nomePorId}
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
      <PageHeader actions={acoesDoCabecalho} title="Leads" description="Contatos e oportunidades do CRM." />
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

      <ExcluirLeadDialog
        comLixeira={comArquivo}
        lead={leadAExcluir}
        onExcluido={() => voltarParaLista(comArquivo ? AVISOS_LEAD.NA_LIXEIRA : AVISOS_LEAD.EXCLUIDO)}
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
          situacao={situacao}
        />
      )}

      <Outlet />
    </>
  );
}
