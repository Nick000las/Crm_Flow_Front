import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { criarDefinicao, editarDefinicao, excluirDefinicao } from '../api/campos-config.api';
import { crmKeys } from '../query-keys';

/**
 * Mudar um campo personalizado faz coluna aparecer ou sumir em todo lugar:
 * form, filtro, colunas da tabela, a lista e a própria matriz de Configurações.
 */
function useMutacaoDeCampos(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        [crmKeys.campos(), crmKeys.leads(), crmKeys.camposConfigurados()].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

export function useCriarDefinicao() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos((definicao) => criarDefinicao(authApi, definicao));
}

export function useEditarDefinicao() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos(({ id, definicao }) => editarDefinicao(authApi, id, definicao));
}

export function useExcluirDefinicao() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos((id) => excluirDefinicao(authApi, id));
}
