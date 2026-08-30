/**
 * @file Define as rotas de app routes, na área de aplicação, conectando telas ou endpoints aos
 * seus pontos de entrada.
 */
import { Navigate, useLocation, useRoutes } from 'react-router-dom';

import { LoadingState } from '@/components/loading-state';
import { SessionRecovery } from '@/components/session-recovery';
import { useAuth } from '@/hooks/useAuth';

import { useAdminRoutes } from './(admin)/admin.routes';
import { appRoutes } from './(app)/app.routes';
import AppLayout from './(app)/app-layout';
import { useAuthRoutes } from './(auth)/auth.routes';

export default function AppRoutes() {
  const { isAuthenticated, loading, sessionError, retrySession } = useAuth();
  const { pathname } = useLocation();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const authRoutes = useAuthRoutes();
  const adminRoutes = useAdminRoutes();

  // `useRoutes` precisa ser chamado em toda renderização — o portão de
  // carregamento fica depois dele, não antes.
  const element = useRoutes([
    { path: 'admin', children: adminRoutes },
    ...authRoutes,
    {
      path: '/',
      // Portão de acesso: sem sessão, o elemento-pai redireciona e os
      // filhos nunca chegam a renderizar. O `*` de `appRoutes` já cobre
      // qualquer rota desconhecida, então não há catch-all no topo.
      element: isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />,
      children: appRoutes,
    },
  ]);

  if (!isAdminRoute && loading) {
    return (
      <main className="grid min-h-svh place-items-center bg-muted/40">
        <LoadingState label="Carregando sessão…" />
      </main>
    );
  }

  if (!isAdminRoute && sessionError) {
    return <SessionRecovery error={sessionError} onRetry={retrySession} />;
  }

  return element;
}
