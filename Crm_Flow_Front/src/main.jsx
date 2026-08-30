import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app.jsx';
import { AuthProvider } from './hooks/useAuth.js';
import { AdminAuthProvider } from './hooks/use-admin-auth.js';
import { BrowserRouter } from 'react-router-dom';

// Os dois providers ficam na raiz, lado a lado. A sessão master não pode ser
// montada só dentro da subárvore `/admin`: sair para qualquer outra rota
// desmontaria o provider e perderia a sessão ao voltar. Aninhados aqui, são
// dois estados independentes que apenas coexistem — nenhum token atravessa.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <App />
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
