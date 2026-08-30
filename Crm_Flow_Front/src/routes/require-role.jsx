import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';

/**
 * Portão de papel (e, opcionalmente, de feature flag) para rotas. É só UX —
 * esconde a tela de quem não pode usá-la; o back valida de verdade com 403.
 *
 * @param {{
 *   roles?: readonly string[],
 *   feature?: string | readonly string[],
 *   fallback: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export function RequireRole({ roles, feature, fallback, children }) {
  const { user } = useAuth();

  if (!podeVer({ roles, feature }, user)) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}
