import { Navigate, useRoutes } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminRoutes } from './(admin)/admin.routes';
import { useAuthRoutes } from './(auth)/auth.routes';
import AppLayout from './(app)/app-layout';
import { appRoutes } from './(app)/app.routes';

export default function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();
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

  if (loading) {
    return (
      <main className="grid min-h-svh place-items-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    );
  }

  return element;
}
