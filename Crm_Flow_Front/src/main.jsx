import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './components/theme-provider.jsx';
import { MotionConfig } from 'motion/react';
import './index.css';
import App from './app.jsx';
import { AuthProvider } from './hooks/useAuth.js';
import { AdminAuthProvider } from './hooks/use-admin-auth.js';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client.js';
import FormularioPublicoApp from './formulario-publico-app.jsx';
import { ehPaginaPublica, prepararCabecalhoPublico } from './lib/pagina-publica.js';

// Os dois providers ficam na raiz, lado a lado. A sessão master não pode ser
// montada só dentro da subárvore `/admin`: sair para qualquer outra rota
// desmontaria o provider e perderia a sessão ao voltar. Aninhados aqui, são
// dois estados independentes que apenas coexistem — nenhum token atravessa.
//
// A página pública do formulário (`/f/:token`) é outra árvore: sem sessão,
// sem `/auth/me` e sem redirecionar para o login.
const publica = ehPaginaPublica(window.location.pathname);
if (publica) {
  prepararCabecalhoPublico();
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            {publica ? (
              <FormularioPublicoApp />
            ) : (
              <AuthProvider>
                <AdminAuthProvider>
                  <App />
                </AdminAuthProvider>
              </AuthProvider>
            )}
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </MotionConfig>
  </StrictMode>,
);
