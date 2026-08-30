/**
 * @file Organiza a tela de boards gallery page, na área de Kanban, e coordena navegação,
 * consultas e ações do usuário.
 */
import './kanban.css';

import { useState } from 'react';
import { KanbanSquare, RefreshCw, Search, Settings2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { EmptyState } from '@/components/empty-state';
import { AsyncContent, CardGridSkeleton } from '@/components/loading-skeletons';
import { StaggerItem, StaggerList } from '@/components/motion/stagger-list';
import { PageHeader } from '@/components/page-header';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

import { AvailableBoardCard } from '../components/available-board-card';
import { useAvailableBoards } from '../hooks/use-available-boards';

export default function BoardsGalleryPage() {
  const { user } = useAuth();
  const { boards, loading, refreshing, error, refresh } = useAvailableBoards();
  const [query, setQuery] = useState('');
  const canManage = ['DONO', 'MASTER'].includes(user?.role);
  const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
  const visibleBoards = boards.filter((board) =>
    board.nome.toLocaleLowerCase('pt-BR').includes(normalizedQuery),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operação visual"
        title="Kanban"
        description="Escolha um quadro para acompanhar etapas, prioridades e entregas da equipe."
        actions={
          canManage ? (
            <Button variant="outline" nativeButton={false} render={<Link to="/kanban/quadros" />}>
              <Settings2 className="size-4" aria-hidden="true" />
              Gerenciar quadros
            </Button>
          ) : null
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-[min(100%,14rem)] flex-1 items-center gap-2.5 text-muted-foreground duration-150 sm:max-w-md">
          <span className="sr-only">Buscar quadros por nome</span>
          <Input
            startIcon={Search}
            type="search"
            placeholder="Buscar um quadro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full min-w-0 text-sm placeholder:text-muted-foreground/75"
          />
        </label>

        <Button
          type="button"
          variant="outline"
          disabled={loading}
          loading={refreshing}
          loadingText="Atualizando…"
          onClick={refresh}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" role="alert">
          {error}
        </Alert>
      )}

      <AsyncContent
        loading={loading}
        skeleton={
          <CardGridSkeleton
            cards={6}
            columnsClass="grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))]"
            label="Carregando seus quadros…"
          />
        }
      >
        {error && boards.length === 0 ? (
          <EmptyState
            icon={KanbanSquare}
            title="Não foi possível carregar os quadros"
            description="Use Atualizar para tentar novamente."
            action={
              <Button type="button" variant="outline" onClick={refresh}>
                <RefreshCw className="size-4" aria-hidden="true" />
                Tentar novamente
              </Button>
            }
          />
        ) : boards.length === 0 ? (
          <EmptyState
            icon={KanbanSquare}
            title="Nenhum quadro disponível"
            description={
              canManage
                ? 'Crie um quadro e escolha a equipe na página Gerenciar quadros.'
                : 'Peça ao administrador para incluir você na equipe de um quadro.'
            }
            action={
              canManage ? (
                <Button nativeButton={false} render={<Link to="/kanban/quadros" />}>
                  Ir para gestão de quadros
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p role="status" className="text-xs font-medium text-muted-foreground">
                {normalizedQuery
                  ? `${visibleBoards.length} de ${boards.length} quadros`
                  : `${boards.length} ${boards.length === 1 ? 'quadro disponível' : 'quadros disponíveis'}`}
              </p>
              <Badge variant="outline" className="text-[11px] tabular-nums">
                {visibleBoards.length}
              </Badge>
            </div>

            {visibleBoards.length > 0 ? (
              <StaggerList className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,17rem),1fr))] gap-4">
                {visibleBoards.map((board) => (
                  <StaggerItem key={board.id ?? board.quadroRef} className="h-full">
                    <AvailableBoardCard board={board} />
                  </StaggerItem>
                ))}
              </StaggerList>
            ) : (
              <EmptyState
                icon={Search}
                title="Nenhum quadro encontrado"
                description="Tente buscar por outro nome ou limpe o filtro atual."
                action={
                  <Button type="button" variant="outline" onClick={() => setQuery('')}>
                    Limpar busca
                  </Button>
                }
              />
            )}
          </div>
        )}
      </AsyncContent>
    </div>
  );
}
