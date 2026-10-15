import { ApiErrorAlert } from '@/components/api-error-alert';
import { FILTRO_VAZIO, contarFiltros } from '../lib/filtro';
import { LeadsTable, LeadsTableSkeleton } from './leads-table';
import { LeadsNaoEncontrados, LeadsVazio, PaginaSemLeads } from './leads-vazio';
import { Paginacao } from './paginacao';

const ERRO_ID = 'crm-leads-erro';
const SEM_FILTRO = Object.freeze({ busca: '', filtro: FILTRO_VAZIO, pagina: 1 });

/**
 * Corpo da lista: escolhe entre erro, carregando, os estados vazios e a
 * tabela paginada.
 *
 * @param {{
 *   atualizar: (mudancas: Partial<import('../lib/url-state').EstadoLista>) => void,
 *   botaoNovo: import('react').ReactNode,
 *   carregando: boolean,
 *   colunas: import('../lib/colunas').Coluna[],
 *   erro: unknown,
 *   estado: import('../lib/url-state').EstadoLista,
 *   leadsQuery: import('@tanstack/react-query').UseQueryResult<import('../types').PaginaLeads>,
 *   nomePorId: Map<string, string>,
 *   onAbrir: (id: string, opcoes?: { editar?: boolean }) => void,
 *   onExcluir: (lead: import('../types').Lead) => void,
 *   podeImportar: boolean,
 * }} props
 */
export function LeadsConteudo({
  atualizar,
  botaoNovo,
  carregando,
  colunas,
  erro,
  estado,
  leadsQuery,
  nomePorId,
  onAbrir,
  onExcluir,
  podeImportar,
}) {
  if (erro) return <ApiErrorAlert error={erro} id={ERRO_ID} />;
  if (carregando) return <LeadsTableSkeleton colunas={colunas} />;

  const { itens, total } = leadsQuery.data;

  if (total === 0) {
    const consultaRestrita = estado.busca || contarFiltros(estado.filtro) > 0;

    return consultaRestrita ? (
      <LeadsNaoEncontrados onLimpar={() => atualizar(SEM_FILTRO)} />
    ) : (
      <LeadsVazio acaoNovo={botaoNovo} podeImportar={podeImportar} />
    );
  }

  if (itens.length === 0) {
    return <PaginaSemLeads onPrimeiraPagina={() => atualizar({ pagina: 1 })} />;
  }

  return (
    <>
      <LeadsTable
        atualizando={leadsQuery.isPlaceholderData}
        colunas={colunas}
        leads={itens}
        nomePorId={nomePorId}
        onAbrir={onAbrir}
        onEditar={(id) => onAbrir(id, { editar: true })}
        onExcluir={onExcluir}
      />
      <Paginacao onChange={atualizar} pagina={estado.pagina} tamanho={estado.tamanho} total={total} />
    </>
  );
}
