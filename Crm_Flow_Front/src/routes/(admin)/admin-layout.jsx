/**
 * @file Define as rotas de admin layout, na área de aplicação, conectando telas ou endpoints
 * aos seus pontos de entrada.
 */
import { Outlet } from 'react-router-dom';

import { AdminShell } from '@/modules/admin/components/admin-shell';

export default function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
