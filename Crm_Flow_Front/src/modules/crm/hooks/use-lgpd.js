import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { anonimizarLead, obterLgpd, salvarLgpd } from '../api/lgpd.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

/** Configuração da LGPD. Só busca com `crm.lgpd`. */
export function useConfigLgpd() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.lgpd(),
    queryFn: ({ signal }) => obterLgpd(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.LGPD),
  });
}

/** A resposta é a configuração inteira; os campos mudam (visibilidade, obrigatório). */
export function useSalvarLgpd() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config) => salvarLgpd(authApi, config),
    onSuccess: (config) => {
      queryClient.setQueryData(crmKeys.lgpd(), config);
      queryClient.invalidateQueries({ queryKey: crmKeys.campos() });
    },
  });
}

/**
 * A resposta é só o resumo: o lead (e os mesclados nele) é buscado de novo,
 * com atividades e histórico.
 */
export function useAnonimizarLead() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => anonimizarLead(authApi, id),
    onSuccess: (_resultado, id) => {
      queryClient.invalidateQueries({ queryKey: crmKeys.leadsAbertos() });
      queryClient.invalidateQueries({ queryKey: crmKeys.leads() });
      queryClient.invalidateQueries({ queryKey: crmKeys.atividades(id) });
      // Os mesclados nele também mudam: o prefixo de todos os históricos.
      queryClient.invalidateQueries({ queryKey: crmKeys.historicos() });
    },
  });
}
