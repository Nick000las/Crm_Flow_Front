import { EyeOff } from 'lucide-react';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { SITUACOES_LEAD } from '../constants';
import { FILTRO_VAZIO, contarFiltros, filtroSemChaves } from '../lib/filtro';
import { LeadsTable, LeadsTableSkeleton } from './leads-table';
import { LeadsNaoEncontrados, LeadsVazio, PaginaSemLeads, SituacaoVazia } from './leads-vazio';
import { Paginacao } from './paginacao';

const ERRO_ID = 'crm-leads-erro';
// Sem `situacao`: limpar a busca não troca de aba.
const SEM_FILTRO = Object.freeze({ busca: '', filtro: FILTRO_VAZIO, pagina: 1 });

/**
 * O filtro (uma view salva por outra pessoa, um link) usa um campo oculto
 * para este usuário (permissão por campo): o back dá 400. Em vez do erro
 * genérico, explica e oferece tirar só esses itens.
 */
function FiltroComCampoOculto({ onTirar }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border border-border px-4 py-3 text-sm" role="alert">
      <EyeOff aria-hidden="true" className="size-4 text-muted-foreground" />
      <p className="flex-1">Este filtro usa um campo que você não pode ver.</p>
      <Button onClick={onTirar} size="sm" variant="outline">
        Tirar este filtro
      </Button>
    </div>
  );
}

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
 *   ocultosNoFiltro?: string[],
 * }} props `ocultosNoFiltro`: chaves do filtro que o usuário não vê (400 do back)
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
  ocultosNoFiltro = [],
}) {
  if (erro && ocultosNoFiltro.length > 0) {
    return (
      <FiltroComCampoOculto
        onTirar={() => atualizar({ filtro: filtroSemChaves(estado.filtro, ocultosNoFiltro), pagina: 1 })}
      />
    );
  }
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
