import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { checarDuplicados, mesclarLeads, obterRegras, salvarRegras } from '../api/duplicidade.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

/** Regras do tenant (Configurações › Duplicidade). Só busca com a flag. */
export function useRegrasDuplicidade() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.duplicidade(),
    queryFn: ({ signal }) => obterRegras(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.DUPLICIDADE),
  });
}

/** A resposta já é a configuração inteira: vira o cache. */
export function useSalvarRegras() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (regras) => salvarRegras(authApi, regras),
    onSuccess: (config) => queryClient.setQueryData(crmKeys.duplicidade(), config),
  });
}

/** Checagem ao vivo no form (no blur). Sem cache: o dado muda a cada tecla. */
export function useChecarDuplicados() {
  const { authApi } = useAuth();

  return useMutation({ mutationFn: (corpo) => checarDuplicados(authApi, corpo) });
}

/**
 * Mesclar: o principal muda (dados, histórico, atividades) e o secundário
 * vai para a lixeira — a lista e os dois detalhes saem do cache.
 */
export function useMesclarLeads() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (corpo) => mesclarLeads(authApi, corpo),
    onSuccess: (principal, { principalId, secundarioId }) => {
      queryClient.setQueryData(crmKeys.lead(principalId), principal);
      queryClient.removeQueries({ queryKey: crmKeys.lead(secundarioId) });
      return Promise.all(
        [crmKeys.leads(), crmKeys.historico(principalId), crmKeys.atividades(principalId)].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
