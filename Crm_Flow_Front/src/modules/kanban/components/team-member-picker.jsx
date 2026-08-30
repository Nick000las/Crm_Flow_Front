/**
 * @file Renderiza team member picker, na área de Kanban, expondo os estados e eventos
 * necessários à interface.
 */
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { cn } from '@/lib/utils';

import { filterTeamMembers, TEAM_PAGE_SIZE, updateTeamSelection } from '../lib/team-selection';
import { MemberAvatar } from './member-avatar';

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
    <div className="space-y-3.5">
      {/* Resumo + ações em lote */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground" role="status">
          <Users className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <Badge variant="secondary" className="tabular-nums">
            {selectedIds.size} {selectedIds.size === 1 ? 'selecionado' : 'selecionados'}
          </Badge>
          <span className="tabular-nums">de {members.length} disponíveis</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={filtered.length === selectedInResults}
            onClick={() => updateResults(true)}
          >
            Adicionar ({filtered.length - selectedInResults})
          </Button>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={!selectedInResults}
            onClick={() => updateResults(false)}
          >
            Remover ({selectedInResults})
          </Button>
        </div>
      </div>

      {/* Busca e filtro */}
      <div className="grid gap-3 sm:grid-cols-[1fr_11.5rem]">
        <div className="grid gap-1.5">
          <Label htmlFor="team-member-search" className="text-xs text-muted-foreground">
            Buscar funcionário
          </Label>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Input
              startIcon={Search}
              id="team-member-search"
              type="search"
              value={query}
              placeholder="Digite um nome…"
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(0);
              }}
              className="w-full min-w-0 text-sm placeholder:text-muted-foreground/75"
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="team-member-filter" className="text-xs text-muted-foreground">
            Mostrar
          </Label>
          <div className="relative">
            <NativeSelect
              id="team-member-filter"
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value);
                setPage(0);
              }}
              className="w-full cursor-pointer pr-8 pl-2.5 text-sm hover:border-border-strong"
            >
              <option value="all">Todos</option>
              <option value="selected">Selecionados</option>
              <option value="available">Disponíveis</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Lista de funcionários */}
      <Card layout="plain" className="max-h-60 divide-y divide-border overflow-y-auto">
        {visible.map((member) => {
          const isSelected = selectedIds.has(member.id);

          return (
            <div
              key={member.id}
              className={cn(
                'flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 transition-colors',
                isSelected ? 'bg-primary/[0.04]' : 'hover:bg-accent/50',
              )}
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checkedValue) => {
                    const checked = checkedValue;

                    onChange((current) => updateTeamSelection(current, [member.id], checked));
                  }}
                  className="shrink-0 cursor-pointer"
                />
                <MemberAvatar name={member.nome} />
                <span className="truncate text-sm font-medium text-foreground">{member.nome}</span>
              </label>

              {onPermissionChange && isSelected && (
                <div className="relative shrink-0">
                  <NativeSelect
                    size="sm"
                    aria-label={`Acesso de ${member.nome}`}
                    value={permissions[member.id] ?? 'editor'}
                    onChange={(event) => onPermissionChange(member.id, event.target.value)}
                    className="cursor-pointer pr-7 pl-2.5 text-xs font-medium hover:border-border-strong"
                  >
                    <option value="editor">Pode editar</option>
                    <option value="leitor">Somente leitura</option>
                  </NativeSelect>
                </div>
              )}
            </div>
          );
        })}

        {!filtered.length && (
          <p className="px-4 py-8 text-center text-xs text-muted-foreground">
            Nenhum funcionário neste filtro. Ajuste a busca ou escolha “Todos”.
          </p>
        )}
      </Card>

      {/* Paginação */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span role="status" className="tabular-nums">
          {filtered.length ? start + 1 : 0}–{Math.min(start + TEAM_PAGE_SIZE, filtered.length)} de{' '}
          {filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="size-3.5" aria-hidden="true" />
            Anterior
          </Button>
          <span className="px-1.5 tabular-nums">
            {page + 1} / {pages}
          </span>
          <Button
            type="button"
            size="xs"
            variant="outline"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            Próxima
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
