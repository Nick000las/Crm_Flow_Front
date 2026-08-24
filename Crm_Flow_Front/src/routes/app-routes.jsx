import { Navigate, Route, Routes } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import EmailLogin from '../modules/auth/pages/email-login';

export default function AppRoutes() {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <main className="grid min-h-svh place-items-center bg-muted/40">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </main>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <AuthenticatedHome user={user} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <EmailLogin />
        }
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />}
      />
    </Routes>
  );
}

function AuthenticatedHome({ user }) {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Flow CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {user?.email
              ? `Sessão iniciada como ${user.email}.`
              : 'Sessão iniciada com sucesso.'}
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
