import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { semChave } from '@/lib/objetos';
import {
  acaoDeArquivo,
  atualizarLead,
  criarLead,
  editarEmMassa,
  excluirLead,
} from '../api/leads.api';
import { crmKeys } from '../query-keys';

/**
 * Salvar ou excluir muda a lista — todas as páginas e filtros, por prefixo.
 * O detalhe é tratado por cada mutation (gravado da resposta ou removido).
 */
function useInvalidarLista() {
  const queryClient = useQueryClient();

  return () => queryClient.invalidateQueries({ queryKey: crmKeys.leads() });
}

export function useCriarLead() {
  const { authApi } = useAuth();
  const invalidar = useInvalidarLista();

  return useMutation({
    mutationFn: (payload) => criarLead(authApi, payload),
    onSuccess: () => invalidar(),
  });
}

export function useAtualizarLead(id) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const invalidar = useInvalidarLista();

  return useMutation({
    mutationFn: (payload) => atualizarLead(authApi, id, payload),
    onSuccess: (resposta) => {
      // A resposta já é o lead formatado: o detalhe atualiza sem nova ida. Os
      // `avisos` (FC1) são da gravação, não do lead: ficam com quem chamou.
      queryClient.setQueryData(crmKeys.lead(id), semChave(resposta, 'avisos'));
      // Cada edição vira um evento no histórico (`crm.atividades`).
      queryClient.invalidateQueries({ queryKey: crmKeys.historico(id) });
      return invalidar();
    },
  });
}

export function useExcluirLead() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const invalidar = useInvalidarLista();

  return useMutation({
    mutationFn: (id) => excluirLead(authApi, id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: crmKeys.lead(id) });
      // FM6: os links ativos de formulário são revogados.
      queryClient.invalidateQueries({ queryKey: crmKeys.linksDeFormulario(id) });
      return invalidar();
    },
  });
}

/**
 * Edição em massa (`crm.massa`). O back responde 200 mesmo com falhas, então
 * lista, leads abertos e históricos recarregam sempre.
 */
export function useEditarEmMassa() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (corpo) => editarEmMassa(authApi, corpo),
    onSuccess: () =>
      Promise.all(
        [crmKeys.leads(), crmKeys.leadsAbertos(), crmKeys.historicos()].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
  });
}

/**
 * Arquivar, desarquivar ou restaurar: mudam a situação do lead, então a
 * lista invalida; a resposta já é o lead, e vira o detalhe (o selo
 * "Arquivado" do drawer troca sem nova ida). Arquivar revoga os links de
 * formulário ativos (FM6), e desarquivar não os reativa.
 *
 * @param {'arquivar' | 'desarquivar' | 'restaurar'} acao
 */
function useAcaoDeArquivo(acao) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();
  const invalidar = useInvalidarLista();

  return useMutation({
    mutationFn: (id) => acaoDeArquivo(authApi, id, acao),
    onSuccess: (lead, id) => {
      queryClient.setQueryData(crmKeys.lead(id), lead);
      queryClient.invalidateQueries({ queryKey: crmKeys.historico(id) });
      queryClient.invalidateQueries({ queryKey: crmKeys.linksDeFormulario(id) });
      return invalidar();
    },
  });
}

export const useArquivarLead = () => useAcaoDeArquivo('arquivar');
export const useDesarquivarLead = () => useAcaoDeArquivo('desarquivar');
export const useRestaurarLead = () => useAcaoDeArquivo('restaurar');
