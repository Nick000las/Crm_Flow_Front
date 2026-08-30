import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import AdminLoginPage from '@/modules/admin/pages/admin-login-page';
import TenantDetailPage from '@/modules/admin/pages/tenant-detail-page';
import TenantsPage from '@/modules/admin/pages/tenants-page';
import AdminLayout from './admin-layout';

/**
 * Área master: auth própria, deliberadamente fora do `useAuth` do tenant —
 * estar logado como tenant não muda nada aqui, nem o contrário.
 *
 * É um hook, e não uma constante, porque o portão depende da sessão master.
 */
export function useAdminRoutes() {
  const { isAuthenticated } = useAdminAuth();

  return [
    {
      path: 'login',
      element: isAuthenticated ? (
        <Navigate to="/admin" replace />
      ) : (
        <AdminLoginPage />
      ),
    },
    {
      // Mesmo portão de `app-routes.jsx`: sem sessão master o elemento-pai
      // redireciona e os filhos nunca chegam a renderizar. O catch-all daqui
      // cobre qualquer rota desconhecida sob `/admin`.
      element: isAuthenticated ? (
        <AdminLayout />
      ) : (
        <Navigate to="/admin/login" replace />
      ),
      children: [
        { index: true, element: <Navigate to="tenants" replace /> },
        { path: 'tenants', element: <TenantsPage /> },
        { path: 'tenants/:tenantId', element: <TenantDetailPage /> },
        { path: '*', element: <Navigate to="/admin" replace /> },
      ],
    },
  ];
}
