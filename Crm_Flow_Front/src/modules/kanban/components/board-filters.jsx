/**
 * @file Renderiza board filters, na área de Kanban, expondo os estados e eventos necessários à
 * interface.
 */
import { useId, useState } from 'react';
import { Bookmark, ChevronDown, Filter, Save, Search, X } from 'lucide-react';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { ModalPresence } from '@/components/motion/modal-presence';
import { SectionIntro } from '@/components/section-intro';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

import { PRIORITIES } from '../lib/card-details';

const EMPTY = { query: '', priority: '', due: '', assignee: '' };
const MAX_VIEWS = 10;

export function BoardFilters({ value, onChange, members, userId, boardId, total, visible }) {
  const savedPanelId = useId();
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
  const [removingView, setRemovingView] = useState(null);
  const [savedOpen, setSavedOpen] = useState(false);

  const active = Object.values(value).filter(Boolean).length;
  const isMine = value.assignee === userId && !value.due && !value.priority && !value.query;
  const isOverdue = value.due === 'overdue' && !value.assignee && !value.priority && !value.query;
  const isHigh = value.priority === 'alta' && !value.assignee && !value.due && !value.query;

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
    <Card
      as="section"
      layout="plain"
      className="space-y-3 p-3"
      aria-label="Busca e filtros de cards"
    >
      <div className="flex flex-col gap-2.5">
        {/* Linha principal: busca + 3 selects */}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(14rem,1.8fr)_repeat(3,minmax(9rem,1fr))]">
          <div className="relative">
            <Input
              startIcon={Search}
              type="search"
              aria-label="Buscar cards"
              placeholder="Buscar por título, descrição ou etiqueta…"
              value={value.query}
              onChange={(e) => patch({ query: e.target.value })}
              className="w-full text-sm placeholder:text-muted-foreground/75"
            />
          </div>

          <div className="relative">
            <NativeSelect
              aria-label="Filtrar por prioridade"
              value={value.priority}
              onChange={(e) => patch({ priority: e.target.value })}
            >
              <option value="">Prioridade: Todas</option>
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="relative">
            <NativeSelect
              aria-label="Filtrar por responsável"
              value={value.assignee}
              onChange={(e) => patch({ assignee: e.target.value })}
            >
              <option value="">Responsável: Todos</option>
              <option value="unassigned">Sem responsável</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nome}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="relative">
            <NativeSelect
              aria-label="Filtrar por prazo"
              value={value.due}
              onChange={(e) => patch({ due: e.target.value })}
            >
              <option value="">Prazo: Todos</option>
              <option value="overdue">Atrasados</option>
              <option value="today">Vencem hoje</option>
              <option value="scheduled">No prazo</option>
              <option value="done">Concluídos</option>
              <option value="none">Sem prazo</option>
            </NativeSelect>
          </div>
        </div>

        {/* Linha secundária: atalhos + contador + filtros salvos */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="flex flex-wrap items-center gap-1.5"
            role="group"
            aria-label="Atalhos de filtro"
          >
            <Button
              type="button"
              size="xs"
              variant={isMine ? 'secondary' : 'outline'}
              className={isMine ? 'border-primary/40 bg-primary/10 text-primary' : ''}
              onClick={() => onChange(isMine ? EMPTY : { ...EMPTY, assignee: userId })}
            >
              Meus cards
            </Button>
            <Button
              type="button"
              size="xs"
              variant={isOverdue ? 'secondary' : 'outline'}
              className={
                isOverdue ? 'border-destructive/40 bg-destructive/10 text-destructive' : ''
              }
              onClick={() => onChange(isOverdue ? EMPTY : { ...EMPTY, due: 'overdue' })}
            >
              Atrasados
            </Button>
            <Button
              type="button"
              size="xs"
              variant={isHigh ? 'secondary' : 'outline'}
              className={isHigh ? 'border-primary/40 bg-primary/10 text-primary' : ''}
              onClick={() => onChange(isHigh ? EMPTY : { ...EMPTY, priority: 'alta' })}
            >
              Prioridade alta
            </Button>
            {active > 0 && (
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(EMPTY)}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Limpar ({active})
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground">
            <span role="status" className="inline-flex items-center gap-1.5 tabular-nums">
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              {visible} de {total} {total === 1 ? 'card' : 'cards'}
            </span>
            <Button
              type="button"
              size="xs"
              variant={savedOpen ? 'secondary' : 'ghost'}
              aria-expanded={savedOpen}
              aria-controls={savedPanelId}
              onClick={() => setSavedOpen((open) => !open)}
              className="gap-1.5"
            >
              <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
              Filtros salvos ({views.length})
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${savedOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </Button>
          </div>
        </div>

        {/* Painel expansível de filtros salvos */}
        {savedOpen && (
          <div id={savedPanelId} className="space-y-3 border-t border-border/70 pt-3">
            <SectionIntro
              heading="h3"
              title="Reutilizar uma combinação de filtros"
              description="Dê um nome aos filtros atuais para aplicar a mesma busca depois. Exemplo: minhas tarefas com prioridade alta."
              icon={Bookmark}
            />
            <p className="text-xs text-muted-foreground">
              Seus filtros ficam salvos neste navegador, com limite de 10 por quadro.
            </p>
            <Form
              noValidate
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();

                if (name.trim() && views.length < MAX_VIEWS) {
                  persist([
                    ...views,
                    { id: crypto.randomUUID(), nome: name.trim(), filters: value },
                  ]);

                  setName('');
                }
              }}
            >
              <Input
                size="sm"
                aria-label="Nome do filtro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                required
                placeholder="Salvar combinação atual como… (ex.: Minhas entregas)"
                className="flex-1 text-xs placeholder:text-muted-foreground/75"
              />
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="shrink-0 px-3"
                disabled={!name.trim() || views.length >= MAX_VIEWS}
              >
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
                Salvar filtro
              </Button>
            </Form>

            {views.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                {views.map((view) => (
                  <div
                    key={view.id}
                    className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-muted/40"
                  >
                    <button
                      type="button"
                      onClick={() => onChange({ ...EMPTY, ...view.filters })}
                      className="px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {view.nome}
                    </button>
                    <button
                      type="button"
                      aria-label={`Remover filtro ${view.nome}`}
                      onClick={() => setRemovingView(view)}
                      className="border-l border-border/70 px-1.5 py-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Você ainda não tem filtros salvos. Escolha uma combinação e dê um nome acima.
              </p>
            )}

            {error && (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
        )}
      </div>

      <ModalPresence>
        {removingView && (
          <ConfirmationDialog
            title="Remover filtro salvo?"
            description={`O filtro "${removingView.nome}" será removido deste navegador e precisará ser recriado caso queira usá-lo novamente.`}
            confirmLabel="Remover filtro"
            pendingLabel="Removendo…"
            onConfirm={() => persist(views.filter((v) => v.id !== removingView.id))}
            onClose={() => setRemovingView(null)}
          />
        )}
      </ModalPresence>
    </Card>
  );
}
