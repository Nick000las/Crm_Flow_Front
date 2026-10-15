import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { excluirView, listarViews, salvarView } from '../api/views.api';
import { crmKeys } from '../query-keys';

export function useViews() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.views(),
    queryFn: ({ signal }) => listarViews(authApi, { signal }),
  });
}

function useMutacaoDeView(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.views() }),
  });
}

export function useSalvarView() {
  const { authApi } = useAuth();

  return useMutacaoDeView((view) => salvarView(authApi, view));
}

export function useExcluirView() {
  const { authApi } = useAuth();

  return useMutacaoDeView((id) => excluirView(authApi, id));
}
