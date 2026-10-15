import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { pesquisarLeads } from '../api/leads.api';
import { paraCorpoDeBusca } from '../lib/filtro';
import { crmKeys } from '../query-keys';

/**
 * Página de leads. `keepPreviousData` mantém a página anterior na tela
 * durante a troca, em vez de piscar o skeleton.
 *
 * @param {import('../lib/url-state').EstadoLista} estado
 */
export function useLeadsSearch({ busca, pagina, tamanho, filtro }) {
  const { authApi } = useAuth();
  const corpo = {
    // O back recusa busca vazia (`min(1)`); sem texto, o campo não vai.
    busca: busca || undefined,
    ...paraCorpoDeBusca(filtro),
    paginacao: { pagina, tamanho },
  };

  return useQuery({
    queryKey: crmKeys.leadsSearch(corpo),
    queryFn: ({ signal }) => pesquisarLeads(authApi, corpo, { signal }),
    placeholderData: keepPreviousData,
  });
}
