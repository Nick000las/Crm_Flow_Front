import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import EmailLogin from '@/modules/auth/pages/email-login';

/** Login do tenant — sem shell, layout mínimo. */
export function useAuthRoutes() {
  const { isAuthenticated } = useAuth();

  return [
    {
      path: 'login',
      element: isAuthenticated ? <Navigate to="/" replace /> : <EmailLogin />,
    },
  ];
}
