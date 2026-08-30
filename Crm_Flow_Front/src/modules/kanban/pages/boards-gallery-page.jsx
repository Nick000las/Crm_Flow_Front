import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KanbanSquare, RefreshCw, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/page-header';
import { AvailableBoardCard } from '../components/available-board-card';
import { useAvailableBoards } from '../hooks/use-available-boards';
import './kanban.css';
import './boards-gallery.css';

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
    <>
      <PageHeader title="Kanban" description="Escolha um quadro para começar a trabalhar." />
      <div className="kb-gallery-toolbar">
        <label className="kb-gallery-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar quadros por nome</span>
          <input
            type="search"
            placeholder="Buscar um quadro…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          className="kb-gallery-refresh"
          disabled={loading}
          loading={refreshing}
          loadingText="Atualizando…"
          onClick={refresh}
        >
          <RefreshCw size={16} aria-hidden="true" /> Atualizar
        </Button>
      </div>
      {error && (
        <p role="alert" className="kb-error">
          {error}
        </p>
      )}
      {loading ? (
        <LoadingState label="Carregando seus quadros…" />
      ) : error && boards.length === 0 ? (
        <div className="kb-gallery-empty">
          <h2>Não foi possível carregar os quadros</h2>
          <p>Use Atualizar para tentar novamente.</p>
        </div>
      ) : boards.length === 0 ? (
        <div className="kb-gallery-empty">
          <KanbanSquare size={32} aria-hidden="true" />
          <h2>Nenhum quadro disponível</h2>
          <p>
            {canManage
              ? 'Crie um quadro e escolha a equipe na página Gerenciar quadros.'
              : 'Peça ao administrador para incluir você na equipe de um quadro.'}
          </p>
          {canManage && <Link to="/kanban/quadros">Ir para gestão de quadros</Link>}
        </div>
      ) : (
        <>
          <p role="status" className="kb-gallery-count">
            {normalizedQuery
              ? `${visibleBoards.length} de ${boards.length} quadros`
              : `${boards.length} ${boards.length === 1 ? 'quadro disponível' : 'quadros disponíveis'}`}
          </p>
          {visibleBoards.length > 0 ? (
            <div className="kb-gallery-grid">
              {visibleBoards.map((board) => (
                <AvailableBoardCard key={board.id} board={board} />
              ))}
            </div>
          ) : (
            <div className="kb-gallery-empty">
              <Search size={32} aria-hidden="true" />
              <h2>Nenhum quadro encontrado</h2>
              <p>Tente buscar por outro nome.</p>
              <button type="button" onClick={() => setQuery('')}>
                Limpar busca
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
