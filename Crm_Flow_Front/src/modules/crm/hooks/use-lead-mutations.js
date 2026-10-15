import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { atualizarLead, criarLead, excluirLead } from '../api/leads.api';
import { crmKeys } from '../query-keys';

/**
 * Salvar ou excluir muda a lista — todas as páginas e filtros, por prefixo.
 * O detalhe é tratado por cada mutation (gravado da resposta ou removido).
 */
function useInvalidarLista() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: crmKeys.leads() });
}

export function useCriarLead() {
  const { authApi } = useAuth();
  const invalidar = useInvalidarLista();

  return useMutation({
    mutationFn: (payload) => criarLead(authApi, payload),
    onSuccess: () => invalidar(),
  });
}

export function useAtualizarLead(id) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const invalidar = useInvalidarLista();

  return useMutation({
    mutationFn: (payload) => atualizarLead(authApi, id, payload),
    onSuccess: (leadAtualizado) => {
      // A resposta já é o lead formatado: o detalhe atualiza sem nova ida.
      queryClient.setQueryData(crmKeys.lead(id), leadAtualizado);
      return invalidar();
    },
  });
}

export function useExcluirLead() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const invalidar = useInvalidarLista();

  return useMutation({
    mutationFn: (id) => excluirLead(authApi, id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: crmKeys.lead(id) });
      return invalidar();
    },
  });
}
