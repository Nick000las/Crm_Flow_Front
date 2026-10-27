import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';
import { obterPermissoes, salvarPermissoes } from '../api/permissoes.api';
import { CRM_FEATURES, PAPEIS_GESTAO } from '../constants';
import { crmKeys } from '../query-keys';

/** Matriz de permissões. Só busca com `crm.permissoes` e para gestão. */
export function usePermissoes() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.permissoes(),
    queryFn: ({ signal }) => obterPermissoes(authApi, { signal }),
    enabled: podeVer({ feature: CRM_FEATURES.PERMISSOES, roles: PAPEIS_GESTAO }, user),
  });
}

/** A resposta é a matriz inteira: vira o cache; os campos do lead mudam de `acesso`. */
export function useSalvarPermissoes() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (porPapel) => salvarPermissoes(authApi, porPapel),
    onSuccess: (config) => {
      queryClient.setQueryData(crmKeys.permissoes(), config);
      queryClient.invalidateQueries({ queryKey: crmKeys.campos() });
    },
  });
}
