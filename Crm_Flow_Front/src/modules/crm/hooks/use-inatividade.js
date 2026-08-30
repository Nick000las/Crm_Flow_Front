import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { obterInatividade, salvarInatividade } from '../api/inatividade.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

/** Dias por status (Configurações › Inatividade). Só busca com a flag. */
export function useInatividade() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.inatividade(),
    queryFn: ({ signal }) => obterInatividade(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.INATIVIDADE),
  });
}

/**
 * A resposta é a lista inteira: vira o cache. Mudar os dias muda quem está
 * esfriando — a lista e os leads abertos recarregam o `esfriando_desde`.
 */
export function useSalvarInatividade() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status) => salvarInatividade(authApi, status),
    onSuccess: (lista) => {
      queryClient.setQueryData(crmKeys.inatividade(), lista);
      return Promise.all(
        [crmKeys.leads(), crmKeys.leadsAbertos()].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      );
    },
  });
}
