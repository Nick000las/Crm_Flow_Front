/**
 * @file Renderiza o aviso discreto de indisponibilidade do tempo real no Kanban. Estados
 * transitórios (`connecting`, `reconnecting`) ocorrem em segundo plano sem poluir o quadro.
 */
import { useKanbanConnection } from '../hooks/use-kanban-events';

export function KanbanConnectionStatus() {
  const { status } = useKanbanConnection();

  if (status !== 'unavailable') {
    return null;
  }

  return (
    <p className="kb-connection-status" data-status={status} role="status">
      <span aria-hidden="true" /> Tempo real indisponível
    </p>
  );
}
