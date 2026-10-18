import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { salvarBlob } from '@/lib/download';
import { exportarLeads } from '../api/exportacao.api';
import { EXPORTACAO } from '../constants';

/** Gera o arquivo e já dispara o download (sem nome do back, `leads.<formato>`). */
export function useExportarLeads() {
  const { authApi } = useAuth();

  return useMutation({
    mutationFn: (pedido) => exportarLeads(authApi, pedido),
    onSuccess: ({ blob, filename }, { formato }) =>
      salvarBlob(blob, filename ?? (formato ? `leads.${formato}` : EXPORTACAO.NOME_ARQUIVO)),
  });
}
