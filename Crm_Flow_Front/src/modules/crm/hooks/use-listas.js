import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { atualizarOpcao, criarOpcao, excluirOpcao, listarListas, reordenarOpcoes } from '../api/listas.api';
import { adicionarOpcao, removerOpcao, reordenarLista, substituirOpcao } from '../lib/listas';
import { crmKeys } from '../query-keys';

const CHAVE = crmKeys.listas();

export function useListas() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: CHAVE,
    queryFn: ({ signal }) => listarListas(authApi, { signal }),
  });
}

/**
 * As opções chegam aos leads por `/crm/leads/fields` (`opcoesLista`): mudar
 * uma lista muda rótulo, cor e seletor em todo lugar.
 */
function invalidarConsumidores(queryClient) {
  return Promise.all(
    [crmKeys.campos(), crmKeys.leads()].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
  );
}

/** Mutação que aplica a resposta no cache das listas e avisa os consumidores. */
function useMutacaoDeLista(mutationFn, aplicar) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (resposta, variaveis) => {
      queryClient.setQueryData(CHAVE, (listas) => (listas ? aplicar(listas, resposta, variaveis) : listas));
      return invalidarConsumidores(queryClient);
    },
  });
}

export function useCriarOpcao() {
  const { authApi } = useAuth();
  return useMutacaoDeLista(
    ({ tipo, corpo }) => criarOpcao(authApi, tipo, corpo),
    (listas, nova, { tipo }) => adicionarOpcao(listas, tipo, nova),
  );
}

/** Editar no dialog e ligar/desligar "Ativa" na linha. */
export function useAtualizarOpcao() {
  const { authApi } = useAuth();
  return useMutacaoDeLista(
    ({ tipo, id, parcial }) => atualizarOpcao(authApi, tipo, id, parcial),
    (listas, atualizada, { tipo }) => substituirOpcao(listas, tipo, atualizada),
  );
}

export function useExcluirOpcao() {
  const { authApi } = useAuth();
  return useMutacaoDeLista(
    ({ tipo, id }) => excluirOpcao(authApi, tipo, id),
    (listas, _resposta, { tipo, id }) => removerOpcao(listas, tipo, id),
  );
}

/** Otimista, como a ordem de Campos: muda ao soltar e volta se o back recusar. */
export function useReordenarOpcoes() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tipo, ids }) => reordenarOpcoes(authApi, tipo, ids),
    onMutate: async ({ tipo, ids }) => {
      await queryClient.cancelQueries({ queryKey: CHAVE });
      const anterior = queryClient.getQueryData(CHAVE);
      queryClient.setQueryData(CHAVE, (listas) => (listas ? reordenarLista(listas, tipo, ids) : listas));
      return { anterior };
    },
    onError: (_erro, _variaveis, contexto) => queryClient.setQueryData(CHAVE, contexto?.anterior),
    // A resposta é a lista do tipo, já na ordem nova.
    onSuccess: (lista, { tipo }) => {
      queryClient.setQueryData(CHAVE, (listas) => (listas ? { ...listas, [tipo]: lista } : listas));
      return invalidarConsumidores(queryClient);
    },
  });
}
