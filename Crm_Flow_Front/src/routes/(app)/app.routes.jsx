import { Navigate } from 'react-router-dom';
import ConfiguracoesPage from '@/modules/configuracoes/pages/configuracoes-page';
import CrmPage from '@/modules/crm/pages/crm-page';
import DashboardPage from '@/modules/dashboard/pages/dashboard-page';

/** Rotas autenticadas. O portão de acesso mora na rota-pai (AppLayout). */
export const appRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <DashboardPage /> },
  { path: 'crm', element: <CrmPage /> },
  { path: 'configuracoes', element: <ConfiguracoesPage /> },
  { path: '*', element: <Navigate to="dashboard" replace /> },
];
