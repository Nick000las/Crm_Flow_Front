import { Outlet } from 'react-router-dom';
import { AdminShell } from '@/modules/admin/components/admin-shell';

export default function AdminLayout() {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}
