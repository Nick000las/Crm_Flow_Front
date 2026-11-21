import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { buscarAssertividade } from '../api/assertividade.api';
import { crmKeys } from '../query-keys';

/**
 * `GET /crm/forecast/assertividade` (FC3, só gestão). Sem cache no front
 * (`staleTime: 0`), como o forecast: o realizado de agora pode mudar. O 4xx
 * não repete (`shouldRetry` do query client). `enabled: false` enquanto a aba
 * não está aberta ou o papel não a vê, para o OPERADOR nunca pedir a rota.
 *
 * @param {import('../api/assertividade.api').ParamsAssertividade} params
 * @param {{ enabled?: boolean }} [options]
 */
export function useAssertividade(params, { enabled = true } = {}) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.forecastAssertividade(params),
    queryFn: ({ signal }) => buscarAssertividade(authApi, params, { signal }),
    enabled,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}
