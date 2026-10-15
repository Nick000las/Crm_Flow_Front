import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { podeVer } from '@/lib/acesso';

/**
 * Portão de papel para rotas. É só UX — esconde a tela de quem não pode usá-la;
 * o back valida de verdade com 403.
 *
 * @param {{
 *   roles: readonly string[],
 *   fallback: string,
 *   children: import('react').ReactNode,
 * }} props
 */
export function RequireRole({ roles, fallback, children }) {
  const { user } = useAuth();

  if (!podeVer({ roles }, user)) return <Navigate to={fallback} replace />;

  return children;
}
