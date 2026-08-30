import { useKanbanConnection } from '../hooks/use-kanban-events';

const LABELS = {
  connecting: 'Conectando…',
  reconnecting: 'Reconectando…',
  unavailable: 'Tempo real indisponível',
};

export function KanbanConnectionStatus() {
  const { status } = useKanbanConnection();
  if (status === 'connected') {
    return null;
  }
  return (
    <p className="kb-connection-status" data-status={status} role="status">
      <span aria-hidden="true" /> {LABELS[status]}
    </p>
  );
}
