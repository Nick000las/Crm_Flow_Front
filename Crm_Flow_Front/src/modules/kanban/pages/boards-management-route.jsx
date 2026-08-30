import { LoadingState } from '@/components/loading-state';
import { lazy, Suspense } from 'react';

const BoardsManagementPage = lazy(() => import('./boards-management-page'));

export default function BoardsManagementRoute() {
  return (
    <Suspense fallback={<LoadingState label="Carregando gestão de quadros…" />}>
      <BoardsManagementPage />
    </Suspense>
  );
}
