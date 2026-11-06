import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { listarProjetosDoLead } from '../api/projetos.api';
import { crmKeys } from '../query-keys';

const FLAG_VINCULO = 'kanban_universal.vinculo_entidade';
const SEM_PROJETOS = Object.freeze([]);

/**
 * Cards ligados ao lead, para a aba Projetos. Qualquer erro (403 de flag ou
 * de módulo) conta como lista vazia: a aba só some.
 *
 * @param {string} leadId
 * @returns {import('../api/projetos.api').ProjetoDoLead[]}
 */
export function useProjetosDoLead(leadId) {
  const { authApi, user } = useAuth();
  const consulta = useQuery({
    queryKey: crmKeys.projetos(leadId),
    queryFn: ({ signal }) => listarProjetosDoLead(authApi, leadId, { signal }),
    enabled: temFeature(user, FLAG_VINCULO),
    retry: false,
  });

  return consulta.isError ? SEM_PROJETOS : (consulta.data ?? SEM_PROJETOS);
}
