import { Route, Routes } from 'react-router-dom';
import FormularioPublicoPage from '@/modules/crm/pages/formulario-publico-page';

/**
 * Árvore só da página pública do formulário (`/f/:token`): sem `AuthProvider`,
 * então sem restaurar sessão, sem `/auth/me` e sem redirecionar para o login.
 * Quem decide entre esta árvore e a do app é o `main.jsx` (`ehPaginaPublica`).
 */
export default function FormularioPublicoApp() {
  return (
    <Routes>
      <Route element={<FormularioPublicoPage />} path="/f/:token" />
    </Routes>
  );
}
