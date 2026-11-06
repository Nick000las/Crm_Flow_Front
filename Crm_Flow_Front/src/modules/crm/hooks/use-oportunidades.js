import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  criarOportunidade,
  editarOportunidade,
  listarOportunidades,
  mudarStatusDaOportunidade,
} from '../api/oportunidades.api';
import { crmKeys } from '../query-keys';

/** @param {string} leadId */
export function useOportunidades(leadId) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.oportunidades(leadId),
    queryFn: ({ signal }) => listarOportunidades(authApi, leadId, { signal }),
  });
}

/**
 * O lead mostra a oportunidade principal e o histórico registra a mudança:
 * recarrega tudo, até no erro, porque o 409 diz que a lista envelheceu. Ganhar
 * pode criar um card de atendimento, que chega por aqui.
 */
function useMutacaoDeOportunidade(leadId, mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSettled: () =>
      Promise.all(
        [
          crmKeys.oportunidades(leadId),
          crmKeys.lead(leadId),
          crmKeys.leads(),
          crmKeys.historico(leadId),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}

/** @param {string} leadId */
export function useCriarOportunidade(leadId) {
  const { authApi } = useAuth();
  return useMutacaoDeOportunidade(leadId, (corpo) => criarOportunidade(authApi, leadId, corpo));
}

/** @param {string} leadId */
export function useEditarOportunidade(leadId) {
  const { authApi } = useAuth();
  return useMutacaoDeOportunidade(leadId, ({ id, corpo }) =>
    editarOportunidade(authApi, id, corpo),
  );
}

/** @param {string} leadId */
export function useMudarStatusDaOportunidade(leadId) {
  const { authApi } = useAuth();
  return useMutacaoDeOportunidade(leadId, ({ id, corpo }) =>
    mudarStatusDaOportunidade(authApi, id, corpo),
  );
}
