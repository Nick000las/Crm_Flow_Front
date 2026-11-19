import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  listarAlertas,
  listarFormulariosDisponiveis,
  listarLinksDaPessoa,
  listarRespostas,
  marcarAlertaVisto,
  obterResposta,
  obterLinkDoFormulario,
  revogarLinkDoFormulario,
} from '../api/links-formulario.api';
import { crmKeys } from '../query-keys';

export function useFormulariosDisponiveis() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.formulariosDisponiveis(),
    queryFn: ({ signal }) => listarFormulariosDisponiveis(authApi, { signal }),
  });
}

/** @param {string} leadId */
export function useLinksDaPessoa(leadId) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.linksDeFormulario(leadId),
    queryFn: ({ signal }) => listarLinksDaPessoa(authApi, leadId, { signal }),
  });
}

/** @param {string} leadId */
export function useRespostasDeFormulario(leadId) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.respostasDeFormulario(leadId),
    queryFn: ({ signal }) => listarRespostas(authApi, leadId, { signal }),
  });
}

/**
 * A resposta não muda depois de enviada.
 *
 * @param {string} leadId
 * @param {string} respostaId
 */
export function useRespostaDeFormulario(leadId, respostaId) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.respostaDeFormulario(leadId, respostaId),
    queryFn: ({ signal }) => obterResposta(authApi, leadId, respostaId, { signal }),
    staleTime: Infinity,
  });
}

/**
 * Alertas da pessoa (FM5): os não vistos por mim, ou `todos` com os vistos.
 *
 * @param {string} leadId
 * @param {{ todos?: boolean }} [opcoes]
 */
export function useAlertasDaPessoa(leadId, { todos = false } = {}) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.alertasDeFormulario(leadId, todos),
    queryFn: ({ signal }) => listarAlertas(authApi, leadId, { todos, signal }),
  });
}

/**
 * "Visto" é por usuário: o back não avisa por tempo real, então o selo do card
 * é relido aqui, em todos os quadros.
 *
 * @param {string} leadId
 */
export function useMarcarAlertaVisto(leadId) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertaId) => marcarAlertaVisto(authApi, leadId, alertaId),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: crmKeys.alertasDeFormulario(leadId) }),
        queryClient.invalidateQueries({ queryKey: crmKeys.quadros() }),
      ]),
  });
}

/** Copiar, copiar de novo e gerar novo: o mesmo POST. */
export function useObterLink(leadId) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formId) => obterLinkDoFormulario(authApi, leadId, formId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: crmKeys.linksDeFormulario(leadId) }),
  });
}

export function useRevogarLink(leadId) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId) => revogarLinkDoFormulario(authApi, leadId, linkId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: crmKeys.linksDeFormulario(leadId) }),
  });
}
