import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { salvarBlob } from '@/lib/download';
import { exportarLeads } from '../api/exportacao.api';
import { EXPORTACAO } from '../constants';

/** Gera a planilha e já dispara o download. */
export function useExportarLeads() {
  const { authApi } = useAuth();

  return useMutation({
    mutationFn: (pedido) => exportarLeads(authApi, pedido),
    onSuccess: ({ blob, filename }) => salvarBlob(blob, filename ?? EXPORTACAO.NOME_ARQUIVO),
  });
}
