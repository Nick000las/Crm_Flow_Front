import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  criarDefinicao,
  editarDefinicao,
  excluirDefinicao,
  listarDefinicoes,
  listarVisibilidade,
  reordenarDefinicoes,
  salvarVisibilidade,
} from '../api/campos-config.api';
import { crmKeys } from '../query-keys';

/** Ordem por `ordem`, para as setas ↑/↓ refletirem o que o form mostra. */
const porOrdem = (definicoes) => [...definicoes].sort((a, b) => a.ordem - b.ordem);

export function useVisibilidade() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.visibilidade(),
    queryFn: ({ signal }) => listarVisibilidade(authApi, { signal }),
  });
}

export function useDefinicoes() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.definicoes(),
    queryFn: ({ signal }) => listarDefinicoes(authApi, { signal }),
    select: porOrdem,
  });
}

/**
 * Mudar um campo faz coluna aparecer ou sumir em todo lugar: form, filtro,
 * colunas da tabela e a própria lista (Camada 2 desligada sai do lead).
 */
function useMutacaoDeCampos(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(
        [crmKeys.campos(), crmKeys.leads(), crmKeys.definicoes(), crmKeys.visibilidade()].map(
          (queryKey) => queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

export function useSalvarVisibilidade() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos((linhas) => salvarVisibilidade(authApi, linhas));
}

export function useCriarDefinicao() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos((definicao) => criarDefinicao(authApi, definicao));
}

export function useEditarDefinicao() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos(({ id, definicao }) => editarDefinicao(authApi, id, definicao));
}

export function useReordenarDefinicoes() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos((ordens) => reordenarDefinicoes(authApi, ordens));
}

export function useExcluirDefinicao() {
  const { authApi } = useAuth();
  return useMutacaoDeCampos((id) => excluirDefinicao(authApi, id));
}
