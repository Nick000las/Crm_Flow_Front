import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { listarCampos } from '../api/campos.api';
import { crmKeys } from '../query-keys';

/** Fonte única dos campos do lead: lista, form, filtro e export leem daqui. */
export function useCampos() {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.campos(),
    queryFn: ({ signal }) => listarCampos(authApi, { signal }),
  });
}
