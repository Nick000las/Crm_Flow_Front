import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { criarAtividade, editarAtividade, excluirAtividade, listarAtividades } from '../api/atividades.api';
import { crmKeys } from '../query-keys';

/** @param {string} leadId */
export function useAtividades(leadId) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.atividades(leadId),
    queryFn: ({ signal }) => listarAtividades(authApi, leadId, { signal }),
  });
}

/**
 * Toda mudança recarrega a lista (a ordem é do back). Concluir (ou criar já
 * concluída) e reabrir mexem em `ultima_interacao_em`: o lead e a tabela
 * recarregam também.
 */
function useInvalidar(leadId) {
  const queryClient = useQueryClient();

  return (mexeNoLead) =>
    Promise.all(
      [crmKeys.atividades(leadId), ...(mexeNoLead ? [crmKeys.lead(leadId), crmKeys.leads()] : [])].map(
        (queryKey) => queryClient.invalidateQueries({ queryKey }),
      ),
    );
}

/** @param {string} leadId */
export function useCriarAtividade(leadId) {
  const { authApi } = useAuth();
  const invalidar = useInvalidar(leadId);

  return useMutation({
    mutationFn: (corpo) => criarAtividade(authApi, leadId, corpo),
    onSuccess: (_, corpo) => invalidar(Boolean(corpo.concluida)),
  });
}

/** Editar no dialog e o checkbox de concluir/reabrir. @param {string} leadId */
export function useEditarAtividade(leadId) {
  const { authApi } = useAuth();
  const invalidar = useInvalidar(leadId);

  return useMutation({
    mutationFn: ({ id, parcial }) => editarAtividade(authApi, leadId, id, parcial),
    onSuccess: (_, { parcial }) => invalidar('concluida' in parcial),
  });
}

/** @param {string} leadId */
export function useExcluirAtividade(leadId) {
  const { authApi } = useAuth();
  const invalidar = useInvalidar(leadId);

  return useMutation({
    mutationFn: (id) => excluirAtividade(authApi, leadId, id),
    onSuccess: () => invalidar(false),
  });
}
