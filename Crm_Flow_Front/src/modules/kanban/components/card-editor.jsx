import { CardVinculo } from './card-vinculo';
import { ModalPresence } from '@/components/motion/modal-presence';
import { Form } from '@/components/ui/form';
import { isComposingKeyEvent } from '@/lib/keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useState } from 'react';
import {
  AlignLeft,
  Archive,
  Bell,
  BellRing,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  Columns3,
  Copy,
  Flag,
  Link2,
  Plus,
  Save,
  SlidersHorizontal,
  Tag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { EditorDialog } from './editor-dialog';
import { CardActivity } from './card-activity';
import { CardComments } from './card-comments';
import { CardExtensions } from './card-extensions';
import {
  formatDueDate,
  getCardDetails,
  getDueState,
  hasNewerCardVersion,
  LABEL_COLORS,
  PRIORITIES,
} from '../lib/card-details';

const INPUT_BASE =
  'w-full rounded-lg border border-input bg-card dark:bg-surface text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50';

const SELECT_BASE =
  'h-9 w-full appearance-none rounded-lg border border-input bg-card dark:bg-surface pl-3 pr-8 text-sm text-foreground transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50';

const LABEL_SWATCH = {
  azul: 'bg-[var(--info)]',
  verde: 'bg-[var(--success)]',
  amarelo: 'bg-[var(--warning)]',
  vermelho: 'bg-[var(--destructive)]',
  roxo: 'bg-[var(--chart-4)]',
  cinza: 'bg-muted-foreground',
};

const PRIORITY_ICON_COLOR = {
  sem_prioridade: 'text-muted-foreground',
  baixa: 'text-[var(--info)]',
  media: 'text-[var(--warning)]',
  alta: 'text-[var(--destructive)]',
  urgente: 'text-[var(--destructive)]',
};

export function CardEditor({
  card,
  canLink = false,
  onChangeLink,
  initialTab = 'details',
  columns = [],
  onDuplicate,
  onFollow,
  onCopyLink,
  onEditComment,
  authApi,
  readOnly = false,
  onArchive,
  archiving = false,
  latestCard,
  columnName,
  members,
  comments,
  commentsLoading = false,
  commentsError,
  commentSubmitting = false,
  saving = false,
  reloading = false,
  busy,
  error,
  user,
  onSave,
  onClose,
  onReload,
  onDelete,
  onComment,
  onDeleteComment,
}) {
  const isNew = !card.id;
  const [title, setTitle] = useState(card.titulo ?? '');
  const [assignee, setAssignee] = useState(card.responsavelId ?? '');
  const [details, setDetails] = useState(() => getCardDetails(card));
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('azul');
  const [itemTitle, setItemTitle] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [hasCommentDraft, setHasCommentDraft] = useState(false);
  const [hasExtensionDraft, setHasExtensionDraft] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [showExtensions, setShowExtensions] = useState(() => {
    const initialDetails = getCardDetails(card);
    return Boolean(
      initialDetails.bloqueio ||
      initialDetails.leadId ||
      initialDetails.links?.length ||
      initialDetails.anexos?.length ||
      (initialDetails.recorrencia && initialDetails.recorrencia !== 'nenhuma') ||
      initialDetails.automacoes?.length,
    );
  });

  const initial = {
    title: card.titulo ?? '',
    assignee: card.responsavelId ?? '',
    details: getCardDetails(card),
  };
  const dirty =
    JSON.stringify({ title, assignee, details }) !== JSON.stringify(initial) ||
    Boolean(labelName || itemTitle || hasCommentDraft || hasExtensionDraft);
  const changedElsewhere = hasNewerCardVersion(card, latestCard);
  const due = getDueState(details.prazo, details.prazoConcluido);
  const completed = details.checklist.filter((item) => item.concluido).length;
  const progress = details.checklist.length
    ? Math.round((completed / details.checklist.length) * 100)
    : 0;
  const canManage = ['DONO', 'MASTER'].includes(user?.role);
  const following = Boolean(user?.id && details.seguidores?.includes(user.id));

  function updateDetails(patch) {
    setDetails((previous) => ({ ...previous, ...patch }));
  }

  function requestClose() {
    if (dirty) {
      setPendingAction('close');
    } else {
      onClose();
    }
  }

  function addLabel() {
    const nome = labelName.trim();
    if (!nome) {
      return;
    }
    if (
      details.etiquetas.some(
        (label) => label.nome.toLocaleLowerCase('pt-BR') === nome.toLocaleLowerCase('pt-BR'),
      )
    ) {
      setFieldError('Este card já tem uma etiqueta com esse nome.');
      return;
    }
    updateDetails({
      etiquetas: [...details.etiquetas, { id: crypto.randomUUID(), nome, cor: labelColor }],
    });
    setLabelName('');
    setFieldError('');
  }

  function addItem() {
    if (!itemTitle.trim()) {
      return;
    }
    updateDetails({
      checklist: [
        ...details.checklist,
        { id: crypto.randomUUID(), titulo: itemTitle.trim(), concluido: false },
      ],
    });
    setItemTitle('');
    setFieldError('');
  }

  function addOnEnter(event, add) {
    if (
      event.key === 'Enter' &&
      !isComposingKeyEvent(event) &&
      !event.repeat &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      add();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) {
      setFieldError('Informe um título para o card.');
      return;
    }
    if (labelName.trim() || itemTitle.trim()) {
      setFieldError('Adicione ou limpe a etiqueta e o item de checklist antes de salvar.');
      return;
    }
    if (hasExtensionDraft) {
      setFieldError(
        'Conclua ou limpe o link/lead em rascunho nas opções avançadas antes de salvar.',
      );
      return;
    }
    if (hasCommentDraft) {
      setFieldError('Publique ou limpe o comentário em rascunho antes de salvar o card.');
      return;
    }
    setFieldError('');
    onSave({
      titulo: title.trim(),
      responsavelId: assignee || null,
      dadosExtras: { ...details, prazo: details.prazo || null },
      ...(card.updatedAt && { expectedUpdatedAt: card.updatedAt }),
    });
  }

  return (
    <EditorDialog
      busy={busy}
      onClose={requestClose}
      className={`kb-card-editor ${isNew ? 'kb-card-editor--new' : 'kb-card-editor--edit'}`}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-6 py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              <Columns3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{columnName || 'Card do quadro'}</span>
            </span>
            {card.id && (
              <span className="font-mono text-xs text-muted-foreground/80">
                #{card.id.slice(0, 6).toUpperCase()}
              </span>
            )}
          </div>
          <h2
            id="kb-editor-title"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {isNew ? 'Novo card' : 'Detalhes do card'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5">
          {!isNew && onFollow && (
            <Button
              type="button"
              variant={following ? 'secondary' : 'outline'}
              size="sm"
              disabled={busy}
              onClick={() => onFollow(!following)}
            >
              {following ? (
                <BellRing className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              ) : (
                <Bell className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {following ? 'Seguindo' : 'Seguir'}
            </Button>
          )}
          {!isNew && !readOnly && onDuplicate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => onDuplicate(card)}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Duplicar
            </Button>
          )}
          {!isNew && onCopyLink && (
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={onCopyLink}>
              <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
              Copiar link
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar card"
            disabled={busy}
            onClick={requestClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <ModalPresence>
        {pendingAction && (
          <ConfirmationDialog
            title="Descartar alterações?"
            description={
              pendingAction === 'archive'
                ? 'O card será arquivado e suas alterações não salvas serão descartadas. Você poderá restaurar o card no arquivo.'
                : 'As alterações não salvas deste card serão descartadas. Esta ação não pode ser desfeita.'
            }
            confirmLabel={
              pendingAction === 'archive' ? 'Descartar e arquivar' : 'Descartar alterações'
            }
            pendingLabel="Descartando…"
            cancelLabel="Continuar editando"
            busy={busy}
            error={error}
            onConfirm={() =>
              pendingAction === 'close'
                ? onClose()
                : pendingAction === 'archive'
                  ? onArchive()
                  : onReload()
            }
            onClose={() => setPendingAction(null)}
          />
        )}
      </ModalPresence>

      {changedElsewhere && (
        <div className="kb-card-conflict shrink-0" role="status">
          <p>Este card foi atualizado enquanto você editava. Seu rascunho foi mantido.</p>
          <Button
            variant="outline"
            size="sm"
            type="button"
            disabled={busy}
            loading={reloading}
            loadingText="Carregando versão atual…"
            onClick={() => {
              if (dirty) {
                setPendingAction('reload');
              } else {
                onReload();
              }
            }}
          >
            Carregar versão atual
          </Button>
        </div>
      )}

      {error && (
        <div className="shrink-0 px-6 pt-4">
          <p role="alert" className="kb-error m-0">
            {error}
          </p>
        </div>
      )}

      <div
        className={`grid min-h-0 flex-1 ${
          isNew ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,1fr)]'
        }`}
      >
        <Form className="flex min-h-0 min-w-0 flex-col" noValidate onSubmit={handleSubmit}>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <fieldset disabled={busy || readOnly} className="min-w-0 space-y-5">
              {/* Bloco principal: Título + Descrição */}
              <div className="space-y-3.5">
                <div className="space-y-1.5">
                  <label
                    htmlFor="kb-card-title"
                    className="block text-xs font-medium text-muted-foreground"
                  >
                    Título <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="kb-card-title"
                    autoFocus={initialTab !== 'comments'}
                    required
                    maxLength={200}
                    value={title}
                    onChange={(event) => {
                      setTitle(event.target.value);
                      if (fieldError) {
                        setFieldError('');
                      }
                    }}
                    placeholder="O que precisa ser feito?"
                    className={`${INPUT_BASE} h-11 px-3.5 text-base font-semibold tracking-tight placeholder:font-normal`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="kb-card-description"
                    className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <AlignLeft className="h-3.5 w-3.5" aria-hidden="true" />
                    Descrição
                  </label>
                  <textarea
                    id="kb-card-description"
                    maxLength={20000}
                    rows={3}
                    value={details.descricao}
                    onChange={(event) => updateDetails({ descricao: event.target.value })}
                    placeholder="Detalhe o objetivo, o contexto e os critérios de entrega…"
                    className={`${INPUT_BASE} min-h-[6rem] resize-y px-3.5 py-2.5 leading-relaxed`}
                  />
                </div>
              </div>

              {/* Propriedades: Prioridade, Responsável, Prazo */}
              <div className="space-y-3 rounded-xl border border-border/80 bg-muted/25 p-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="kb-card-priority"
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <Flag
                        className={`h-3.5 w-3.5 ${PRIORITY_ICON_COLOR[details.prioridade] || 'text-muted-foreground'}`}
                        aria-hidden="true"
                      />
                      Prioridade
                    </label>
                    <div className="relative">
                      <select
                        id="kb-card-priority"
                        value={details.prioridade}
                        onChange={(event) => updateDetails({ prioridade: event.target.value })}
                        className={SELECT_BASE}
                      >
                        {PRIORITIES.map((priority) => (
                          <option key={priority.value} value={priority.value}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="kb-card-assignee"
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      Responsável
                    </label>
                    <div className="relative">
                      <select
                        id="kb-card-assignee"
                        value={assignee}
                        onChange={(event) => setAssignee(event.target.value)}
                        className={SELECT_BASE}
                      >
                        <option value="">Sem responsável</option>
                        {assignee && !members.some((member) => member.id === assignee) && (
                          <option value={assignee} disabled>
                            Participante indisponível
                          </option>
                        )}
                        {members.map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.nome}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="kb-card-due"
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
                    >
                      <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                      Prazo de entrega
                    </label>
                    <input
                      id="kb-card-due"
                      type="date"
                      min="0001-01-01"
                      max="9999-12-31"
                      value={details.prazo}
                      onInput={(event) =>
                        updateDetails({ prazo: event.target.value, prazoConcluido: false })
                      }
                      className={`${INPUT_BASE} h-9 px-3`}
                    />
                  </div>
                </div>

                {(!isNew || details.prazo) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2.5">
                    <label
                      className={`inline-flex items-center gap-2 text-xs font-medium ${
                        details.prazo
                          ? 'cursor-pointer text-foreground'
                          : 'cursor-not-allowed text-muted-foreground'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!details.prazo || busy}
                        checked={details.prazoConcluido}
                        onChange={(event) =>
                          updateDetails({ prazoConcluido: event.target.checked })
                        }
                        className="h-4 w-4 rounded accent-[var(--primary)]"
                      />
                      Entrega concluída
                      {!details.prazo && (
                        <span className="font-normal text-muted-foreground/75">
                          (defina um prazo acima)
                        </span>
                      )}
                    </label>
                    {due && (
                      <span className="kb-due" data-state={due.key}>
                        {due.label} · {formatDueDate(details.prazo)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Etiquetas */}
              <section className="space-y-2.5" aria-labelledby="kb-labels-title">
                <div className="flex items-center justify-between">
                  <h3
                    id="kb-labels-title"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                    Etiquetas
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {details.etiquetas.length}/12
                  </span>
                </div>

                {details.etiquetas.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {details.etiquetas.map((label) => (
                      <span key={label.id} className="kb-label" data-color={label.cor}>
                        {label.nome}
                        <button
                          type="button"
                          aria-label={`Remover etiqueta ${label.nome}`}
                          onClick={() =>
                            updateDetails({
                              etiquetas: details.etiquetas.filter((item) => item.id !== label.id),
                            })
                          }
                          className="ml-0.5 inline-flex rounded p-0.5 transition-opacity hover:opacity-75"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {details.etiquetas.length < 12 && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      aria-label="Nome da etiqueta"
                      placeholder="Ex.: Cliente, Financeiro…"
                      maxLength={30}
                      value={labelName}
                      onChange={(event) => setLabelName(event.target.value)}
                      onKeyDown={(event) => addOnEnter(event, addLabel)}
                      className={`${INPUT_BASE} h-9 flex-1 px-3`}
                    />
                    <div className="flex items-center justify-between gap-2 sm:justify-start">
                      <div
                        role="radiogroup"
                        aria-label="Cor da etiqueta"
                        className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/25 px-2.5 py-1.5"
                      >
                        {LABEL_COLORS.map((color) => {
                          const active = labelColor === color.value;
                          return (
                            <button
                              key={color.value}
                              type="button"
                              role="radio"
                              aria-checked={active}
                              aria-label={`Cor ${color.label}`}
                              title={color.label}
                              onClick={() => setLabelColor(color.value)}
                              className={`h-4 w-4 rounded-full transition-transform ${
                                LABEL_SWATCH[color.value] || 'bg-muted-foreground'
                              } ${
                                active
                                  ? 'scale-110 ring-2 ring-foreground/80 ring-offset-2 ring-offset-card'
                                  : 'opacity-65 hover:scale-105 hover:opacity-100'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!labelName.trim()}
                        onClick={addLabel}
                        className="h-9 shrink-0 px-3"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Etiqueta
                      </Button>
                    </div>
                  </div>
                )}
              </section>

              {/* Checklist */}
              <section className="space-y-2.5" aria-labelledby="kb-checklist-title">
                <div className="flex items-center justify-between">
                  <h3
                    id="kb-checklist-title"
                    className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                    Checklist
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {completed}/{details.checklist.length}
                    {details.checklist.length > 0 ? ` · ${progress}%` : ''}
                  </span>
                </div>

                {details.checklist.length > 0 && (
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progress}
                    aria-label={`${progress}% do checklist concluído`}
                    className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {details.checklist.length > 0 && (
                  <div className="space-y-1.5">
                    {details.checklist.map((item, index) => (
                      <div
                        key={item.id}
                        className="group flex items-center gap-2.5 rounded-lg border border-border/70 bg-card/60 px-2.5 py-1.5 transition-colors focus-within:border-primary/50"
                      >
                        <input
                          type="checkbox"
                          aria-label={`Concluir ${item.titulo}`}
                          checked={item.concluido}
                          onChange={(event) =>
                            updateDetails({
                              checklist: details.checklist.map((row) =>
                                row.id === item.id
                                  ? { ...row, concluido: event.target.checked }
                                  : row,
                              ),
                            })
                          }
                          className="h-4 w-4 shrink-0 rounded accent-[var(--primary)]"
                        />
                        <input
                          aria-label={`Texto do item ${index + 1}`}
                          required
                          maxLength={200}
                          value={item.titulo}
                          onChange={(event) =>
                            updateDetails({
                              checklist: details.checklist.map((row) =>
                                row.id === item.id ? { ...row, titulo: event.target.value } : row,
                              ),
                            })
                          }
                          className={`min-w-0 flex-1 bg-transparent text-sm focus:outline-none ${
                            item.concluido
                              ? 'text-muted-foreground line-through'
                              : 'text-foreground'
                          }`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Remover item ${item.titulo}`}
                          onClick={() =>
                            updateDetails({
                              checklist: details.checklist.filter((row) => row.id !== item.id),
                            })
                          }
                          className="opacity-60 transition-opacity hover:text-destructive group-hover:opacity-100"
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {details.checklist.length < 100 && (
                  <div className="flex items-center gap-2">
                    <input
                      aria-label="Novo item do checklist"
                      maxLength={200}
                      placeholder="Adicionar uma etapa da tarefa…"
                      value={itemTitle}
                      onChange={(event) => setItemTitle(event.target.value)}
                      onKeyDown={(event) => addOnEnter(event, addItem)}
                      className={`${INPUT_BASE} h-9 flex-1 px-3`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!itemTitle.trim()}
                      onClick={addItem}
                      className="h-9 shrink-0 px-3"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Item
                    </Button>
                  </div>
                )}
              </section>

              {/* Modelo + Opções avançadas (Bloqueio, Lead, Links, Anexos, Recorrência, Automações) */}
              <div className="space-y-3 border-t border-border/70 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-foreground">
                    <input
                      type="checkbox"
                      checked={details.modelo === true}
                      onChange={(event) => updateDetails({ modelo: event.target.checked })}
                      className="h-4 w-4 rounded accent-[var(--primary)]"
                    />
                    Salvar como modelo reutilizável
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExtensions((open) => !open)}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                    {showExtensions ? 'Ocultar opções avançadas' : 'Opções avançadas'}
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform ${showExtensions ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  </Button>
                </div>

                {showExtensions && (
                  <CardExtensions
                    details={details}
                    onChange={updateDetails}
                    columns={columns}
                    members={members}
                    authApi={authApi}
                    onDraftChange={setHasExtensionDraft}
                  />
                )}
              </div>
            </fieldset>

            {fieldError && (
              <p role="alert" className="kb-error mt-4 mb-0">
                {fieldError}
              </p>
            )}
          </div>

          <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-card px-6 py-3.5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <span
                className={`h-2 w-2 rounded-full ${
                  dirty ? 'bg-[var(--warning)]' : 'bg-muted-foreground/40'
                }`}
                aria-hidden="true"
              />
              {dirty
                ? 'Alterações não salvas'
                : isNew
                  ? 'Preencha o título para criar'
                  : 'Nenhuma alteração pendente'}
            </p>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={requestClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={saving}
                loadingText={isNew ? 'Criando card…' : 'Salvando card…'}
                disabled={busy || readOnly || changedElsewhere || !title.trim()}
              >
                {isNew ? (
                  <>
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Criar card
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden="true" />
                    Salvar card
                  </>
                )}
              </Button>
            </div>
          </footer>
        </Form>

        {!isNew && (
          <aside
            className="min-h-0 min-w-0 space-y-6 overflow-y-auto border-t border-border bg-muted/25 p-5 lg:border-l lg:border-t-0"
            aria-label="Conversa e ações do card"
          >
            <CardComments
              comments={comments}
              members={members}
              readOnly={readOnly}
              loading={commentsLoading}
              error={commentsError}
              submitting={commentSubmitting}
              busy={busy}
              canManage={canManage}
              userId={user?.id}
              onComment={onComment}
              onEdit={onEditComment}
              onDelete={onDeleteComment}
              onDraftChange={setHasCommentDraft}
            />
            <CardVinculo
              vinculo={card.vinculo}
              canLink={canLink && !readOnly}
              disabled={busy}
              onLink={onChangeLink}
              onUnlink={() => onChangeLink(null)}
            />
            <CardActivity
              cardId={card.id}
              authApi={authApi}
              revision={`${latestCard?.updatedAt}:${comments.map((comment) => comment.id).join(',')}`}
            />
            {!readOnly && (
              <div className="space-y-3 border-t border-border pt-4">
                <Button
                  variant="outline"
                  className="w-full justify-center"
                  loading={archiving}
                  loadingText="Arquivando…"
                  disabled={busy}
                  onClick={() => (dirty ? setPendingAction('archive') : onArchive())}
                >
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  Arquivar card
                </Button>
                <div className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-xs text-muted-foreground">
                    A exclusão remove o card e todos os seus comentários permanentemente.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="w-full justify-center"
                    disabled={busy}
                    onClick={onDelete}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Excluir card
                  </Button>
                </div>
              </div>
            )}
          </aside>
        )}
      </div>
    </EditorDialog>
  );
}
