import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  atualizarCampoConfigurado,
  listarCamposConfigurados,
  reordenarCamposConfigurados,
  restaurarOrdemPadrao,
} from '../api/configuracoes.api';
import { substituirCampo } from '../lib/configuracoes-campos';
import { ordenarPorIds } from '../lib/ordem';
import { crmKeys } from '../query-keys';

const CHAVE = crmKeys.camposConfigurados();

export function useCamposConfigurados() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: CHAVE,
    queryFn: ({ signal }) => listarCamposConfigurados(authApi, { signal }),
  });
}

/**
 * Mudar configuração reflete em todas as telas: os campos de cada contexto
 * (`/fields`) e a lista de leads (Camada 2 oculta em tudo sai do lead).
 */
function invalidarConsumidores(queryClient) {
  return Promise.all(
    [crmKeys.campos(), crmKeys.leads()].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

/** Um checkbox da matriz, "Obrigatório" ou o renomear: `PUT` parcial por campo. */
export function useAtualizarCampoConfigurado() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, parcial }) => atualizarCampoConfigurado(authApi, id, parcial),
    onSuccess: (atualizado) => {
      queryClient.setQueryData(CHAVE, (lista) =>
        lista ? substituirCampo(lista, atualizado) : lista,
      );
      return invalidarConsumidores(queryClient);
    },
  });
}

/**
 * Reordenar é otimista: a lista muda ao soltar e volta ao que era se o back
 * recusar — esperar a resposta faria a linha "pular de volta" a cada arrasto.
 */
export function useReordenarCampos() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids) => reordenarCamposConfigurados(authApi, ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: CHAVE });
      const anterior = queryClient.getQueryData(CHAVE);
      queryClient.setQueryData(CHAVE, (lista) => (lista ? ordenarPorIds(lista, ids) : lista));
      return { anterior };
    },
    onError: (_erro, _ids, contexto) => queryClient.setQueryData(CHAVE, contexto?.anterior),
    onSuccess: (lista) => {
      queryClient.setQueryData(CHAVE, lista);
      return invalidarConsumidores(queryClient);
    },
  });
}

export function useRestaurarOrdemPadrao() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => restaurarOrdemPadrao(authApi),
    onSuccess: (lista) => {
      queryClient.setQueryData(CHAVE, lista);
      return invalidarConsumidores(queryClient);
    },
  });
}
