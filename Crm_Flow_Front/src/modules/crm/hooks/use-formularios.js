import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  criarFormulario,
  editarFormulario,
  listarCamposElegiveis,
  listarFormularios,
  obterFormulario,
  obterVersao,
  publicarFormulario,
} from '../api/formularios.api';
import { crmKeys } from '../query-keys';

export function useFormularios() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.formularios(),
    queryFn: ({ signal }) => listarFormularios(authApi, { signal }),
  });
}

export function useCamposElegiveis() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.formulariosElegiveis(),
    queryFn: ({ signal }) => listarCamposElegiveis(authApi, { signal }),
  });
}

/** @param {string} id */
export function useFormulario(id) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.formulario(id),
    queryFn: ({ signal }) => obterFormulario(authApi, id, { signal }),
  });
}

/**
 * Versão publicada não muda: não recarrega.
 *
 * @param {string} id
 * @param {string | null} versaoId `null` = nada aberto
 */
export function useVersaoDoFormulario(id, versaoId) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.formularioVersao(id, versaoId),
    queryFn: ({ signal }) => obterVersao(authApi, id, versaoId, { signal }),
    enabled: Boolean(versaoId),
    staleTime: Infinity,
  });
}

/**
 * Só a lista: o detalhe chega pela resposta. Ativo e versão mudam também o que
 * a ficha pode enviar.
 */
function recarregarLista(queryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: crmKeys.formularios(), exact: true }),
    queryClient.invalidateQueries({ queryKey: crmKeys.formulariosDisponiveis() }),
  ]);
}

export function useCriarFormulario() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados) => criarFormulario(authApi, dados),
    onSuccess: (detalhe) => {
      queryClient.setQueryData(crmKeys.formulario(detalhe.id), detalhe);
      return recarregarLista(queryClient);
    },
  });
}

/** A resposta é o detalhe: vira o cache, e o editor remonta com ele. */
export function useSalvarFormulario(id) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (corpo) => editarFormulario(authApi, id, corpo),
    onSuccess: (detalhe) => {
      queryClient.setQueryData(crmKeys.formulario(id), detalhe);
      return recarregarLista(queryClient);
    },
  });
}

/** A resposta é a versão: o detalhe recarrega para mostrá-la na lista de versões. */
export function usePublicarFormulario(id) {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => publicarFormulario(authApi, id),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: crmKeys.formulario(id), exact: true }),
        recarregarLista(queryClient),
      ]),
  });
}
