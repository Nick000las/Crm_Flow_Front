/**
 * @file Implementa a integração de main, na área de aplicação, mantendo seus recursos e
 * contratos compartilhados.
 */
import './index.css';

import { StrictMode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './app.jsx';
import { ThemeProvider } from './components/theme-provider.jsx';
import FormularioPublicoApp from './formulario-publico-app.jsx';
import { AdminAuthProvider } from './hooks/use-admin-auth.js';
import { AuthProvider } from './hooks/useAuth.js';
import { ehPaginaPublica, prepararCabecalhoPublico } from './lib/pagina-publica.js';
import { queryClient } from './lib/query-client.js';
import { pwaStore } from './pwa/pwa-store.js';

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

pwaStore.start();

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
