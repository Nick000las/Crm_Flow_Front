import { Outlet } from 'react-router-dom';
import { KanbanRealtimeProvider } from '../components/kanban-realtime-provider';
import { KanbanConnectionStatus } from '../components/kanban-connection-status';
import { useKanbanConnection } from '../hooks/use-kanban-events';
import './kanban.css';

/** O socket vai pelo `Outlet`: o quadro comercial é do CRM, que não importa o Kanban. */
function ConteudoDoKanban() {
  const { socket } = useKanbanConnection();

  return (
    <>
      <KanbanConnectionStatus />
      <Outlet context={{ socket }} />
    </>
  );
}

export default function KanbanLayout() {
  return (
    <KanbanRealtimeProvider>
      <ConteudoDoKanban />
    </KanbanRealtimeProvider>
  );
}
