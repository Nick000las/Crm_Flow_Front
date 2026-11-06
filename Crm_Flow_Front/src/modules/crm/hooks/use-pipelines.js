import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  atualizarPipeline,
  criarPipeline,
  excluirPipeline,
  listarPipelines,
  reordenarStatus,
} from '../api/pipelines.api';
import { comStatusReordenados } from '../lib/pipelines';
import { crmKeys } from '../query-keys';
import { invalidarStatus } from './use-listas';

const CHAVE = crmKeys.pipelines();

export function usePipelines() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: CHAVE,
    queryFn: ({ signal }) => listarPipelines(authApi, { signal }),
  });
}

/** A resposta de escrita não traz a lista: recarrega sempre. */
function useMutacaoDePipeline(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({ mutationFn, onSuccess: () => invalidarStatus(queryClient) });
}

export function useCriarPipeline() {
  const { authApi } = useAuth();
  return useMutacaoDePipeline((corpo) => criarPipeline(authApi, corpo));
}

export function useAtualizarPipeline() {
  const { authApi } = useAuth();
  return useMutacaoDePipeline(({ id, parcial }) => atualizarPipeline(authApi, id, parcial));
}

export function useExcluirPipeline() {
  const { authApi } = useAuth();
  return useMutacaoDePipeline((id) => excluirPipeline(authApi, id));
}

/** Otimista, como a ordem de Listas: muda ao soltar e volta se o back recusar. */
export function useReordenarStatus(pipelineId) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids) => reordenarStatus(authApi, pipelineId, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: CHAVE });
      const anterior = queryClient.getQueryData(CHAVE);
      queryClient.setQueryData(CHAVE, (pipelines) =>
        pipelines ? comStatusReordenados(pipelines, pipelineId, ids) : pipelines,
      );
      return { anterior };
    },
    onError: (_erro, _variaveis, contexto) => queryClient.setQueryData(CHAVE, contexto?.anterior),
    onSuccess: () => invalidarStatus(queryClient),
  });
}
