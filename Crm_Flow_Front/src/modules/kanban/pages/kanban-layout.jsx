/**
 * @file O socket vai pelo `Outlet`: o quadro comercial é do CRM, que não importa o Kanban.
 */
import './kanban.css';

import { Outlet } from 'react-router-dom';

import { KanbanConnectionStatus } from '../components/kanban-connection-status';
import { KanbanRealtimeProvider } from '../components/kanban-realtime-provider';
import { useKanbanConnection } from '../hooks/use-kanban-events';

/** O socket vai pelo `Outlet`: o quadro comercial é do CRM, que não importa o Kanban. */
function ConteudoDoKanban() {
  const { socket } = useKanbanConnection();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <KanbanConnectionStatus />
      <Outlet context={{ socket }} />
    </div>
  );
}

export default function KanbanLayout() {
  return (
    <KanbanRealtimeProvider>
      <ConteudoDoKanban />
    </KanbanRealtimeProvider>
  );
}
