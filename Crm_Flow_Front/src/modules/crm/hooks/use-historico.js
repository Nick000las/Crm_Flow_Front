import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { listarCategoriasHistorico, listarHistorico } from '../api/atividades.api';
import { CRM_FEATURES, TAMANHO_HISTORICO } from '../constants';
import { crmKeys } from '../query-keys';

/**
 * Histórico do lead, do mais recente para o mais antigo, de página em
 * página ("Carregar mais"). As categorias (M16) entram na key dentro do
 * prefixo `historico(id)`: invalidar o histórico do lead alcança todas.
 * Trocar de categoria mantém a lista anterior até a nova chegar.
 *
 * @param {string} leadId
 * @param {string[]} [categorias] vazio = todas
 */
export function useHistorico(leadId, categorias = []) {
  const { authApi } = useAuth();

  return useInfiniteQuery({
    queryKey: [...crmKeys.historico(leadId), categorias],
    queryFn: ({ pageParam, signal }) =>
      listarHistorico(
        authApi,
        leadId,
        { pagina: pageParam, tamanho: TAMANHO_HISTORICO, categorias },
        { signal },
      ),
    initialPageParam: 1,
    getNextPageParam: ({ pagina, tamanho, total }) =>
      pagina * tamanho < total ? pagina + 1 : undefined,
    placeholderData: keepPreviousData,
  });
}

/** Categorias do filtro do histórico (`crm.timeline`); lista fixa do back. */
export function useCategoriasHistorico() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.historicoCategorias(),
    queryFn: ({ signal }) => listarCategoriasHistorico(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.TIMELINE),
    staleTime: Infinity,
  });
}
