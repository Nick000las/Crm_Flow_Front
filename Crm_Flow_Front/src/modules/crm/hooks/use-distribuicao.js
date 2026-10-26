import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { criarGrupo, editarGrupo, excluirGrupo, obterDistribuicao, salvarDistribuicao } from '../api/distribuicao.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

/** Configuração da distribuição (regras e grupos). Só busca com `crm.distribuicao`. */
export function useDistribuicao() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.distribuicao(),
    queryFn: ({ signal }) => obterDistribuicao(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.DISTRIBUICAO),
  });
}

/**
 * O form do lead: com a distribuição ligada, o responsável vazio é
 * "Automático". Sem a flag, carregando ou com erro = `false` (como antes).
 */
export function useDistribuicaoLigada() {
  return useDistribuicao().data?.ativo === true;
}

/** A resposta é a configuração inteira: vira o cache. */
export function useSalvarDistribuicao() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config) => salvarDistribuicao(authApi, config),
    onSuccess: (config) => queryClient.setQueryData(crmKeys.distribuicao(), config),
  });
}

function useMutacaoDeGrupo(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.distribuicao() }),
  });
}

export function useCriarGrupo() {
  const { authApi } = useAuth();
  return useMutacaoDeGrupo((grupo) => criarGrupo(authApi, grupo));
}

export function useEditarGrupo() {
  const { authApi } = useAuth();
  return useMutacaoDeGrupo(({ id, grupo }) => editarGrupo(authApi, id, grupo));
}

export function useExcluirGrupo() {
  const { authApi } = useAuth();
  return useMutacaoDeGrupo((id) => excluirGrupo(authApi, id));
}
