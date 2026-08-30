/**
 * @file Busca de pessoas para vincular ao card, nas rotas do CRM.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';

const MINIMO_DE_CARACTERES = 2;
const RESULTADOS = 8;

/**
 * Busca de pessoas para vincular ao card, nas rotas do CRM.
 *
 * @param {string} termo
 */
export function useBuscaPessoas(termo) {
  const { authApi } = useAuth();
  const busca = termo.trim();

  return useQuery({
    queryKey: ['kanban', 'busca-pessoas', busca],
    queryFn: ({ signal }) =>
      authApi.post(
        '/crm/leads/search',
        { busca, paginacao: { pagina: 1, tamanho: RESULTADOS } },
        { signal },
      ),
    enabled: busca.length >= MINIMO_DE_CARACTERES,
    placeholderData: keepPreviousData,
  });
}
