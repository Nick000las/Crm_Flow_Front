import { Navigate } from 'react-router-dom';
import ConfiguracoesPage from '@/modules/configuracoes/pages/configuracoes-page';
import { LeadSheet } from '@/modules/crm/components/lead-sheet';
import { PAPEIS_GESTAO } from '@/modules/crm/constants';
import ConfiguracoesCrmPage from '@/modules/crm/pages/configuracoes-page';
import ImportarPage from '@/modules/crm/pages/importar-page';
import LeadsPage from '@/modules/crm/pages/leads-page';
import { ROTAS_CRM } from '@/modules/crm/rotas';
import DashboardPage from '@/modules/dashboard/pages/dashboard-page';
import { RequireRole } from '../require-role';

/** Rotas autenticadas. O portão de acesso mora na rota-pai (AppLayout). */
export const appRoutes = [
  { index: true, element: <Navigate to="dashboard" replace /> },
  { path: 'dashboard', element: <DashboardPage /> },
  {
    path: 'crm',
    children: [
      {
        // A lista é layout: o Sheet do lead abre por cima, sem desmontá-la.
        element: <LeadsPage />,
        children: [
          { index: true, element: null },
          { path: 'leads/:leadId', element: <LeadSheet /> },
        ],
      },
      {
        path: 'importar',
        element: (
          <RequireRole roles={PAPEIS_GESTAO} fallback={ROTAS_CRM.LISTA}>
            <ImportarPage />
          </RequireRole>
        ),
      },
      // A antiga página Campos virou Configurações › Campos; links velhos seguem.
      { path: 'campos', element: <Navigate to={ROTAS_CRM.CONFIGURACOES} replace /> },
      {
        // Sem `:secao` (ou com uma oculta), a página leva à primeira visível.
        path: 'configuracoes/:secao?',
        // Papel por subseção (o OPERADOR edita o próprio layout): a página decide.
        element: <ConfiguracoesCrmPage />,
      },
    ],
  },
  { path: 'configuracoes', element: <ConfiguracoesPage /> },
  { path: '*', element: <Navigate to="dashboard" replace /> },
];
