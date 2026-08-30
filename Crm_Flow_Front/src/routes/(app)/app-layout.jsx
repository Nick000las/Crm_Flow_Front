/**
 * @file Define as rotas de app layout, na área de aplicação, conectando telas ou endpoints aos
 * seus pontos de entrada.
 */
import { Outlet } from 'react-router-dom';

import { AppShell } from '@/modules/shell/components/app-shell';

export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
