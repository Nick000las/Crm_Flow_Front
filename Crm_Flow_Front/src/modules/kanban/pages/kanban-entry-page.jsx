import { LoadingState } from '@/components/loading-state';
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import BoardsGalleryPage from './boards-gallery-page';

const KanbanPage = lazy(() => import('./kanban-page'));

export default function KanbanEntryPage() {
  const [searchParams] = useSearchParams();
  const boardId = searchParams.get('quadro');

  return boardId ? (
    <Suspense fallback={<LoadingState label="Carregando quadro…" />}>
      <KanbanPage key={boardId} boardId={boardId} />
    </Suspense>
  ) : (
    <BoardsGalleryPage />
  );
}
