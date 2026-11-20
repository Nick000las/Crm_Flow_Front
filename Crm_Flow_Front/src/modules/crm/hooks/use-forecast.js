import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  atualizarDataPrevista,
  buscarForecast,
  listarOportunidadesDoForecast,
} from '../api/forecast.api';
import { crmKeys } from '../query-keys';

/**
 * `GET /crm/forecast`. Sem cache no front (`staleTime: 0`): o back já guarda
 * 60 s e troca a chave a cada escrita, então entrar na página sempre relê.
 * O 4xx não repete (`shouldRetry` do query client).
 *
 * @param {import('../api/forecast.api').ParamsForecast} params
 */
export function useForecast(params) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.forecast(params),
    queryFn: ({ signal }) => buscarForecast(authApi, params, { signal }),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

/**
 * A lista por trás de um número. `params` null = nenhuma lista aberta.
 * @param {import('../api/forecast.api').ParamsListaForecast | null} params
 */
export function useListaDoForecast(params) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.forecastLista(params),
    queryFn: ({ signal }) => listarOportunidadesDoForecast(authApi, params, { signal }),
    enabled: Boolean(params),
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

/**
 * Ação em massa. Recarrega no sucesso e no erro: um 500 deixa gravadas as que
 * já passaram (handoff FC2, 2.3). As oportunidades mudam nas fichas abertas.
 */
export function useAtualizarDataPrevista() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (corpo) => atualizarDataPrevista(authApi, corpo),
    onSettled: () =>
      Promise.all(
        [
          crmKeys.forecastTudo(),
          crmKeys.leads(),
          crmKeys.leadsAbertos(),
          // A ficha pode estar aberta por cima: aba Oportunidades e Histórico.
          crmKeys.oportunidadesTodas(),
          crmKeys.historicos(),
        ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ),
  });
}
