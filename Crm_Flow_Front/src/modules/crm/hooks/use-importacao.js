import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  buscarImportacao,
  confirmarImportacao,
  previsualizarImportacao,
  validarImportacao,
} from '../api/importacao.api';
import { IMPORT_JOB_STATUS } from '../constants';
import { emProcessamento } from '../lib/importacao';
import { crmKeys } from '../query-keys';

const INTERVALO_POLLING_MS = 2_000;

export function usePreviewImportacao() {
  const { authApi } = useAuth();
  return useMutation({ mutationFn: (arquivo) => previsualizarImportacao(authApi, arquivo) });
}

export function useValidarImportacao() {
  const { authApi } = useAuth();
  return useMutation({ mutationFn: (dados) => validarImportacao(authApi, dados) });
}

export function useConfirmarImportacao() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobId, acoes }) => confirmarImportacao(authApi, jobId, acoes),
    // A resposta já é o status: o acompanhamento começa sem esperar o polling.
    onSuccess: (job, { jobId }) => queryClient.setQueryData(crmKeys.importJob(jobId), job),
  });
}

/**
 * Status do job, com polling enquanto `processando`. Ao concluir, a lista
 * de leads é invalidada — ela mudou.
 *
 * @param {string | null} jobId
 */
export function useImportacao(jobId) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: crmKeys.importJob(jobId),
    queryFn: ({ signal }) => buscarImportacao(authApi, jobId, { signal }),
    enabled: Boolean(jobId),
    refetchInterval: (atual) => (emProcessamento(atual.state.data?.status) ? INTERVALO_POLLING_MS : false),
  });
  const status = query.data?.status;

  useEffect(() => {
    if (status === IMPORT_JOB_STATUS.CONCLUIDO) {
      queryClient.invalidateQueries({ queryKey: crmKeys.leads() });
    }
  }, [status, queryClient]);

  return query;
}
