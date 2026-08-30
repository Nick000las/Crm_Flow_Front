import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MemberAvatar } from './member-avatar';
import { filterTeamMembers, TEAM_PAGE_SIZE, updateTeamSelection } from '../lib/team-selection';

export function TeamMemberPicker({
  members,
  selectedIds,
  onChange,
  permissions = {},
  onPermissionChange,
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [requestedPage, setPage] = useState(0);
  const filtered = filterTeamMembers(members, selectedIds, query, filter);
  const pages = Math.max(1, Math.ceil(filtered.length / TEAM_PAGE_SIZE));
  const page = Math.min(requestedPage, pages - 1);
  const start = page * TEAM_PAGE_SIZE;
  const visible = filtered.slice(start, start + TEAM_PAGE_SIZE);
  const selectedInResults = filtered.filter((member) => selectedIds.has(member.id)).length;
  function updateResults(selected) {
    onChange((current) =>
      updateTeamSelection(
        current,
        filtered.map((member) => member.id),
        selected,
      ),
    );
    setPage(0);
  }

  return (
    <div className="kb-team-picker">
      <div className="kb-team-picker-summary" role="status">
        <Users size={16} aria-hidden="true" />
        <strong>
          {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
        </strong>
        <span>de {members.length} funcionários disponíveis</span>
      </div>
      <div className="kb-team-search-controls">
        <label>
          Buscar funcionário
          <span className="kb-team-search-input">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              placeholder="Digite um nome…"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
            />
          </span>
        </label>
        <label>
          Mostrar
          <select
            value={filter}
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(0);
            }}
          >
            <option value="all">Todos</option>
            <option value="selected">Selecionados</option>
            <option value="available">Disponíveis para adicionar</option>
          </select>
        </label>
      </div>
      <div className="kb-team-bulk-actions">
        <Button
          type="button"
          variant="outline"
          disabled={filtered.length === selectedInResults}
          onClick={() => updateResults(true)}
        >
          Adicionar resultados ({filtered.length - selectedInResults})
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!selectedInResults}
          onClick={() => updateResults(false)}
        >
          Remover resultados ({selectedInResults})
        </Button>
      </div>
      <p className="kb-hint">
        As ações acima incluem todas as páginas do filtro atual. A equipe só muda ao salvar o
        quadro.
      </p>
      <div className="kb-team-picker-list">
        {visible.map((member) => (
          <div key={member.id} className="kb-team-option">
            <label>
              <input
                type="checkbox"
                checked={selectedIds.has(member.id)}
                onChange={(event) => {
                  const checked = event.target.checked;
                  onChange((current) => updateTeamSelection(current, [member.id], checked));
                }}
              />
              <MemberAvatar name={member.nome} />
              <span>{member.nome}</span>
            </label>
            {onPermissionChange && selectedIds.has(member.id) && (
              <select
                aria-label={`Acesso de ${member.nome}`}
                value={permissions[member.id] ?? 'editor'}
                onChange={(event) => onPermissionChange(member.id, event.target.value)}
              >
                <option value="editor">Pode editar</option>
                <option value="leitor">Somente leitura</option>
              </select>
            )}
          </div>
        ))}
        {!filtered.length && (
          <p className="kb-team-no-results">
            Nenhum funcionário neste filtro. Ajuste a busca ou escolha “Todos”.
          </p>
        )}
      </div>
      <div className="kb-team-pagination">
        <span role="status">
          {filtered.length ? start + 1 : 0}–{Math.min(start + TEAM_PAGE_SIZE, filtered.length)} de{' '}
          {filtered.length} resultados
        </span>
        <div className="kb-actions">
          <Button
            type="button"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {page + 1} de {pages}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  );
}
