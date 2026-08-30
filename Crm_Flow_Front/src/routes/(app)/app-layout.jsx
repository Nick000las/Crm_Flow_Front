import { Outlet } from 'react-router-dom';
import { AppShell } from '@/modules/shell/components/app-shell';

export default function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
