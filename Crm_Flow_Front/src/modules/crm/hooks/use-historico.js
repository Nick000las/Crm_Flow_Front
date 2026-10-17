import { useInfiniteQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { listarHistorico } from '../api/atividades.api';
import { TAMANHO_HISTORICO } from '../constants';
import { crmKeys } from '../query-keys';

/**
 * Histórico do lead, do mais recente para o mais antigo, de página em
 * página ("Carregar mais").
 *
 * @param {string} leadId
 */
export function useHistorico(leadId) {
  const { authApi } = useAuth();

  return useInfiniteQuery({
    queryKey: crmKeys.historico(leadId),
    queryFn: ({ pageParam, signal }) =>
      listarHistorico(authApi, leadId, { pagina: pageParam, tamanho: TAMANHO_HISTORICO }, { signal }),
    initialPageParam: 1,
    getNextPageParam: ({ pagina, tamanho, total }) => (pagina * tamanho < total ? pagina + 1 : undefined),
  });
}
