/**
 * @file Organiza a tela de boards management route, na área de Kanban, e coordena navegação,
 * consultas e ações do usuário.
 */
import { lazy, Suspense } from 'react';

import { CardGridSkeleton } from '@/components/loading-skeletons';

const BoardsManagementPage = lazy(() => import('./boards-management-page'));

export default function BoardsManagementRoute() {
  return (
    <Suspense
      fallback={
        <CardGridSkeleton
          cards={3}
          columnsClass="grid-cols-1"
          label="Carregando gestão de quadros…"
        />
      }
    >
      <BoardsManagementPage />
    </Suspense>
  );
}
