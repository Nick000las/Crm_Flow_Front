import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { obterLayout, removerMeu, salvarMeu, salvarPadrao } from '../api/layout.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

const CHAVE = crmKeys.layout();

/** Layout só existe com `crm.layout`; sem ela, nem pede (evita o 403). */
export function useLayout() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: CHAVE,
    queryFn: ({ signal }) => obterLayout(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.LAYOUT),
  });
}

/**
 * O que tabela e drawer usam. `null` = sem layout (flag desligada, ainda
 * carregando ou erro): as telas seguem como antes do M4, sem bloquear.
 *
 * @returns {import('../lib/layout.js').LayoutEfetivo | null}
 */
export function useLayoutEfetivo() {
  return useLayout().data?.efetivo ?? null;
}

/** Toda mutação devolve o layout inteiro (`{ padrao, meu, efetivo… }`). */
function useMutacaoDeLayout(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (resposta) => queryClient.setQueryData(CHAVE, resposta),
  });
}

export function useSalvarPadrao() {
  const { authApi } = useAuth();
  return useMutacaoDeLayout((layout) => salvarPadrao(authApi, layout));
}

export function useSalvarMeu() {
  const { authApi } = useAuth();
  return useMutacaoDeLayout((parcial) => salvarMeu(authApi, parcial));
}

export function useRemoverMeu() {
  const { authApi } = useAuth();
  return useMutacaoDeLayout(() => removerMeu(authApi));
}
