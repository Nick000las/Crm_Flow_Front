import { Outlet } from 'react-router-dom';
import { KanbanRealtimeProvider } from '../components/kanban-realtime-provider';
import { KanbanConnectionStatus } from '../components/kanban-connection-status';
import './kanban.css';

export default function KanbanLayout() {
  return (
    <KanbanRealtimeProvider>
      <KanbanConnectionStatus />
      <Outlet />
    </KanbanRealtimeProvider>
  );
}
