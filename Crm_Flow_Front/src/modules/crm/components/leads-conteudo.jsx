import { ApiErrorAlert } from '@/components/api-error-alert';
import { SITUACOES_LEAD } from '../constants';
import { FILTRO_VAZIO, contarFiltros } from '../lib/filtro';
import { LeadsTable, LeadsTableSkeleton } from './leads-table';
import { LeadsNaoEncontrados, LeadsVazio, PaginaSemLeads, SituacaoVazia } from './leads-vazio';
import { Paginacao } from './paginacao';

const ERRO_ID = 'crm-leads-erro';
// Sem `situacao`: limpar a busca não troca de aba.
const SEM_FILTRO = Object.freeze({ busca: '', filtro: FILTRO_VAZIO, pagina: 1 });

/**
 * Corpo da lista: escolhe entre erro, carregando, os estados vazios e a
 * tabela paginada. `acoesDeArquivo` só vem com `crm.arquivo`; `onMesclar`,
 * com `crm.duplicidade` para DONO/MASTER; `selecao`, com isso ou `crm.massa`.
 *
 * @param {{
 *   atualizar: (mudancas: Partial<import('../lib/url-state').EstadoLista>) => void,
 *   botaoNovo: import('react').ReactNode,
 *   carregando: boolean,
 *   colunas: import('../lib/colunas').Coluna[],
 *   erro: unknown,
 *   estado: import('../lib/url-state').EstadoLista,
 *   identificador: import('../lib/layout').ItemLayout | null,
 *   leadsQuery: import('@tanstack/react-query').UseQueryResult<import('../types').PaginaLeads>,
 *   nomePorId: Map<string, string>,
 *   onAbrir: (id: string, opcoes?: { editar?: boolean }) => void,
 *   onExcluir: (lead: import('../types').Lead) => void,
 *   podeImportar: boolean,
 *   situacao: 'ativos' | 'arquivados' | 'lixeira',
 *   acoesDeArquivo?: {
 *     onArquivar: (lead: import('../types').Lead) => void,
 *     onDesarquivar: (lead: import('../types').Lead) => void,
 *     onRestaurar: (lead: import('../types').Lead) => void,
 *     restaurandoId: string | null,
 *   },
 *   onMesclar?: (lead: import('../types').Lead) => void,
 *   selecao?: import('./leads-table').SelecaoDaTabela | null,
 * }} props
 */
export function LeadsConteudo({
  atualizar,
  botaoNovo,
  carregando,
  colunas,
  erro,
  estado,
  identificador,
  leadsQuery,
  nomePorId,
  onAbrir,
  onExcluir,
  podeImportar,
  situacao,
  acoesDeArquivo,
  onMesclar,
  selecao,
}) {
  if (erro) return <ApiErrorAlert error={erro} id={ERRO_ID} />;
  if (carregando) return <LeadsTableSkeleton colunas={colunas} identificador={identificador} />;

  const { itens, total } = leadsQuery.data;

  if (total === 0) {
    const consultaRestrita = estado.busca || contarFiltros(estado.filtro) > 0;

    if (consultaRestrita) return <LeadsNaoEncontrados onLimpar={() => atualizar(SEM_FILTRO)} />;
    if (situacao !== SITUACOES_LEAD.ATIVOS) return <SituacaoVazia situacao={situacao} />;
    return <LeadsVazio acaoNovo={botaoNovo} podeImportar={podeImportar} />;
  }

  if (itens.length === 0) {
    return <PaginaSemLeads onPrimeiraPagina={() => atualizar({ pagina: 1 })} />;
  }

  return (
    <>
      <LeadsTable
        atualizando={leadsQuery.isPlaceholderData}
        colunas={colunas}
        identificador={identificador}
        leads={itens}
        lixeira={situacao === SITUACOES_LEAD.LIXEIRA}
        nomePorId={nomePorId}
        onAbrir={onAbrir}
        onEditar={(id) => onAbrir(id, { editar: true })}
        onExcluir={onExcluir}
        {...acoesDeArquivo}
        onMesclar={onMesclar}
        selecao={selecao}
      />
      <Paginacao onChange={atualizar} pagina={estado.pagina} tamanho={estado.tamanho} total={total} />
    </>
  );
}
