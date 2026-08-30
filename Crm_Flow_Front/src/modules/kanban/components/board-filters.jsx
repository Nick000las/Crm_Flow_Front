import { useState } from 'react';
import { Filter, Search, Save, X } from 'lucide-react';
import { PRIORITIES } from '../lib/card-details';
import { Button } from '@/components/ui/button';

const EMPTY = { query: '', priority: '', due: '', assignee: '' };
const MAX_VIEWS = 10;

export function BoardFilters({ value, onChange, members, userId, boardId, total, visible }) {
  const storageKey = `kanban:views:${userId}:${boardId}`;
  const [views, setViews] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      return Array.isArray(saved)
        ? saved
            .filter(
              (v) =>
                v &&
                typeof v.id === 'string' &&
                typeof v.nome === 'string' &&
                v.filters &&
                Object.values(v.filters).every((item) => typeof item === 'string'),
            )
            .slice(0, MAX_VIEWS)
        : [];
    } catch {
      return [];
    }
  });
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const active = Object.values(value).filter(Boolean).length;
  function persist(next) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setViews(next);
      setError('');
    } catch {
      setError('Não foi possível salvar o filtro neste navegador.');
    }
  }
  const patch = (values) => onChange({ ...value, ...values });
  return (
    <section className="kb-filter-panel" aria-label="Busca e filtros de cards">
      <div className="kb-filter-main">
        <label className="kb-filter-search">
          Buscar cards
          <span className="kb-search-field">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              placeholder="Título, descrição ou etiqueta…"
              value={value.query}
              onChange={(e) => patch({ query: e.target.value })}
            />
          </span>
        </label>
        <label>
          Prioridade
          <select value={value.priority} onChange={(e) => patch({ priority: e.target.value })}>
            <option value="">Todas</option>
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Responsável
          <select value={value.assignee} onChange={(e) => patch({ assignee: e.target.value })}>
            <option value="">Todos</option>
            <option value="unassigned">Sem responsável</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </label>
        <label>
          Prazo
          <select value={value.due} onChange={(e) => patch({ due: e.target.value })}>
            <option value="">Todos</option>
            <option value="overdue">Atrasados</option>
            <option value="today">Vencem hoje</option>
            <option value="scheduled">No prazo</option>
            <option value="done">Concluídos</option>
            <option value="none">Sem prazo</option>
          </select>
        </label>
      </div>
      <div className="kb-filter-shortcuts">
        <Button variant="outline" onClick={() => onChange({ ...EMPTY, assignee: userId })}>
          Meus cards
        </Button>
        <Button variant="outline" onClick={() => onChange({ ...EMPTY, due: 'overdue' })}>
          Atrasados
        </Button>
        <Button variant="outline" onClick={() => onChange({ ...EMPTY, priority: 'alta' })}>
          Prioridade alta
        </Button>
        <span role="status">
          {visible} de {total} cards · <Filter size={13} aria-hidden="true" /> {active} filtros
          ativos
        </span>
        {active > 0 && (
          <Button variant="ghost" onClick={() => onChange(EMPTY)}>
            <X size={13} /> Limpar
          </Button>
        )}
      </div>
      <details className="kb-saved-filters">
        <summary>Filtros salvos ({views.length})</summary>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && views.length < MAX_VIEWS) {
              persist([...views, { id: crypto.randomUUID(), nome: name.trim(), filters: value }]);
              setName('');
            }
          }}
        >
          <label>
            Nome do filtro
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              required
              placeholder="Ex.: Minhas entregas da semana"
            />
          </label>
          <Button
            variant="outline"
            type="submit"
            disabled={!name.trim() || views.length >= MAX_VIEWS}
          >
            <Save size={14} /> Salvar filtro
          </Button>
        </form>
        <p className="kb-hint">Até 10 filtros por quadro, salvos para você neste navegador.</p>
        {views.map((view) => (
          <div className="kb-saved-filter" key={view.id}>
            <Button variant="outline" onClick={() => onChange({ ...EMPTY, ...view.filters })}>
              {view.nome}
            </Button>
            <Button
              variant="ghost"
              aria-label={`Remover filtro ${view.nome}`}
              onClick={() => persist(views.filter((v) => v.id !== view.id))}
            >
              <X size={14} />
            </Button>
          </div>
        ))}
        {error && <p role="alert">{error}</p>}
      </details>
    </section>
  );
}
