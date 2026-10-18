import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { listarNotificacoes, marcarComoLida, marcarTodasComoLidas } from '../api/notificacoes.api';
import { INTERVALO_NOTIFICACOES_MS, TAMANHO_NOTIFICACOES } from '../lib/notificacoes';
import { notificacoesKeys } from '../query-keys';

/**
 * Uma página do sino. Não há push: recarrega de tempos em tempos (o
 * contador `naoLidas` vem junto) e ao abrir o sino (`refetch`).
 *
 * @param {number} pagina
 */
export function useNotificacoes(pagina) {
  const { authApi } = useAuth();
  const paginacao = { pagina, tamanho: TAMANHO_NOTIFICACOES };

  return useQuery({
    queryKey: notificacoesKeys.pagina(pagina, TAMANHO_NOTIFICACOES),
    queryFn: ({ signal }) => listarNotificacoes(authApi, paginacao, { signal }),
    placeholderData: keepPreviousData,
    refetchInterval: INTERVALO_NOTIFICACOES_MS,
  });
}

function useMutacaoDeNotificacao(mutationFn) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificacoesKeys.all() }),
  });
}

export function useMarcarComoLida() {
  const { authApi } = useAuth();
  return useMutacaoDeNotificacao((id) => marcarComoLida(authApi, id));
}

export function useMarcarTodasComoLidas() {
  const { authApi } = useAuth();
  return useMutacaoDeNotificacao(() => marcarTodasComoLidas(authApi));
}
