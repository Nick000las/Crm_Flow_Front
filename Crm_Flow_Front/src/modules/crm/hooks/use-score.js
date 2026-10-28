import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { obterScore, recalcularScore, salvarScore } from '../api/score.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

const INTERVALO_PROGRESSO_MS = 1000;

/**
 * Configuração da pontuação. Só busca com `crm.score`. Recarrega a cada
 * segundo enquanto um recálculo roda — ou enquanto `acompanhar` (o PUT e o
 * "Recalcular agora" só respondem no fim, e o progresso sai daqui).
 *
 * @param {{ acompanhar?: boolean }} [opcoes]
 */
export function useConfigScore({ acompanhar = false } = {}) {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.configScore(),
    queryFn: ({ signal }) => obterScore(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.SCORE),
    refetchInterval: (query) =>
      acompanhar || query.state.data?.recalculo?.emAndamento ? INTERVALO_PROGRESSO_MS : false,
  });
}

/** Faixas para pintar o score; `null` sem a flag ou enquanto carrega (= só o número). */
export function useFaixasScore() {
  return useConfigScore().data?.faixas ?? null;
}

/** Os scores mudaram, e o back pode ter ligado a visibilidade do Lead score. */
function invalidarLeads(queryClient) {
  queryClient.invalidateQueries({ queryKey: crmKeys.leads() });
  queryClient.invalidateQueries({ queryKey: crmKeys.leadsAbertos() });
  queryClient.invalidateQueries({ queryKey: crmKeys.campos() });
}

/** A resposta é a configuração inteira (já recalculada): vira o cache. */
export function useSalvarScore() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config) => salvarScore(authApi, config),
    onSuccess: (config) => {
      queryClient.setQueryData(crmKeys.configScore(), config);
      invalidarLeads(queryClient);
    },
  });
}

export function useRecalcularScore() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => recalcularScore(authApi),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: crmKeys.configScore() });
      invalidarLeads(queryClient);
    },
  });
}
