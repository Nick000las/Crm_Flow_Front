import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { buscarLead } from '../api/leads.api';
import { crmKeys } from '../query-keys';

/** @param {string | undefined} id sem id (criação), a query não roda */
export function useLead(id) {
  const { authApi } = useAuth();

  return useQuery({
    queryKey: crmKeys.lead(id),
    queryFn: ({ signal }) => buscarLead(authApi, id, { signal }),
    enabled: Boolean(id),
  });
}
