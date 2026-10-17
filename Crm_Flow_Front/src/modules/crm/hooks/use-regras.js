import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { criarRegra, editarRegra, excluirRegra, listarRegras } from '../api/regras.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

/** Regras do tenant. Só busca com `crm.regras`. */
export function useRegras() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.regras(),
    queryFn: ({ signal }) => listarRegras(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.REGRAS),
  });
}

/**
 * As regras para o form do lead, ou `null` (sem a flag, carregando ou com
 * erro): aí o form fica como antes, e o back segue validando no salvar.
 */
export function useRegrasDoForm() {
  return useRegras().data ?? null;
}

function useMutacaoDeRegra(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.regras() }),
  });
}

export function useCriarRegra() {
  const { authApi } = useAuth();
  return useMutacaoDeRegra((corpo) => criarRegra(authApi, corpo));
}

/** Editar no dialog e o liga/desliga da lista. */
export function useEditarRegra() {
  const { authApi } = useAuth();
  return useMutacaoDeRegra(({ id, parcial }) => editarRegra(authApi, id, parcial));
}

export function useExcluirRegra() {
  const { authApi } = useAuth();
  return useMutacaoDeRegra((id) => excluirRegra(authApi, id));
}
