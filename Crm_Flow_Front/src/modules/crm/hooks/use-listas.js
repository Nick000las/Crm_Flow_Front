/**
 * @file Otimista, como a ordem de Campos: muda ao soltar e volta se o back recusar.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';

import {
  atualizarOpcao,
  criarOpcao,
  excluirOpcao,
  listarListas,
  reordenarOpcoes,
} from '../api/listas.api';
import { atualizarStatus, criarStatus, excluirStatus } from '../api/pipelines.api';
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
    [crmKeys.campos(), crmKeys.leads(), crmKeys.pipelines()].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}

/**
 * Mudou um pipeline ou um status dele: a aba Status de Listas é a do pipeline
 * padrão, então ela recarrega junto com o resto.
 *
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 */
export function invalidarStatus(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: CHAVE }),
    invalidarConsumidores(queryClient),
  ]);
}

/**
 * Mutação que aplica a resposta no cache das listas e avisa os consumidores.
 * Com `pipelineId`, é status de um pipeline: recarrega em vez de aplicar.
 */
function useMutacaoDeLista(mutationFn, aplicar, pipelineId) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (resposta, variaveis) => {
      if (pipelineId) {
        return invalidarStatus(queryClient);
      }

      queryClient.setQueryData(CHAVE, (listas) =>
        listas ? aplicar(listas, resposta, variaveis) : listas,
      );

      return invalidarConsumidores(queryClient);
    },
  });
}

/** @param {string} [pipelineId] status de um pipeline, em vez da lista do tenant */
export function useCriarOpcao(pipelineId) {
  const { authApi } = useAuth();

  return useMutacaoDeLista(
    ({ tipo, corpo }) =>
      pipelineId ? criarStatus(authApi, pipelineId, corpo) : criarOpcao(authApi, tipo, corpo),
    (listas, nova, { tipo }) => adicionarOpcao(listas, tipo, nova),
    pipelineId,
  );
}

/**
 * Editar no dialog e ligar/desligar "Ativa" na linha.
 *
 * @param {string} [pipelineId]
 */
export function useAtualizarOpcao(pipelineId) {
  const { authApi } = useAuth();

  return useMutacaoDeLista(
    ({ tipo, id, parcial }) =>
      pipelineId
        ? atualizarStatus(authApi, pipelineId, id, parcial)
        : atualizarOpcao(authApi, tipo, id, parcial),
    (listas, atualizada, { tipo }) => substituirOpcao(listas, tipo, atualizada),
    pipelineId,
  );
}

/** @param {string} [pipelineId] */
export function useExcluirOpcao(pipelineId) {
  const { authApi } = useAuth();

  return useMutacaoDeLista(
    ({ tipo, id }) =>
      pipelineId ? excluirStatus(authApi, pipelineId, id) : excluirOpcao(authApi, tipo, id),
    (listas, _resposta, { tipo, id }) => removerOpcao(listas, tipo, id),
    pipelineId,
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

      queryClient.setQueryData(CHAVE, (listas) =>
        listas ? reordenarLista(listas, tipo, ids) : listas,
      );

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
