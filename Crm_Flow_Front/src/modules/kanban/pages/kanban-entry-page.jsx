/**
 * @file Organiza a tela de kanban entry page, na área de Kanban, e coordena navegação,
 * consultas e ações do usuário.
 */
import { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';

import { BoardSkeleton } from '@/components/loading-skeletons';

import BoardsGalleryPage from './boards-gallery-page';

const KanbanPage = lazy(() => import('./kanban-page'));

export default function KanbanEntryPage() {
  const [searchParams] = useSearchParams();
  const boardId = searchParams.get('quadro');

  return boardId ? (
    <Suspense fallback={<BoardSkeleton label="Carregando quadro…" />}>
      <KanbanPage key={boardId} boardId={boardId} />
    </Suspense>
  ) : (
    <BoardsGalleryPage />
  );
}
