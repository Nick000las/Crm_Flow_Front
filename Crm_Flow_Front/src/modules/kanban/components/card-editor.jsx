import { Button } from '@/components/ui/button';
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { useState } from 'react';
import {
  AlignLeft,
  CalendarDays,
  CheckSquare,
  Flag,
  Plus,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { EditorDialog } from './editor-dialog';
import { CardActivity } from './card-activity';
import { CardComments } from './card-comments';
import {
  formatDueDate,
  getCardDetails,
  getDueState,
  hasNewerCardVersion,
  LABEL_COLORS,
  PRIORITIES,
} from '../lib/card-details';

export function CardEditor({
  card,
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
  const [title, setTitle] = useState(card.titulo ?? '');
  const [assignee, setAssignee] = useState(card.responsavelId ?? '');
  const [details, setDetails] = useState(() => getCardDetails(card));
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('azul');
  const [itemTitle, setItemTitle] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [hasCommentDraft, setHasCommentDraft] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const initial = {
    title: card.titulo ?? '',
    assignee: card.responsavelId ?? '',
    details: getCardDetails(card),
  };
  const dirty =
    JSON.stringify({ title, assignee, details }) !== JSON.stringify(initial) ||
    Boolean(labelName || itemTitle || hasCommentDraft);
  const changedElsewhere = hasNewerCardVersion(card, latestCard);
  const due = getDueState(details.prazo, details.prazoConcluido);
  const completed = details.checklist.filter((item) => item.concluido).length;
  const progress = details.checklist.length
    ? Math.round((completed / details.checklist.length) * 100)
    : 0;
  const canManage = ['DONO', 'MASTER'].includes(user?.role);

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
  }
  function addOnEnter(event, add) {
    if (event.key === 'Enter') {
      event.preventDefault();
      add();
    }
  }

  return (
    <EditorDialog busy={busy} onClose={requestClose} className="kb-card-editor">
      <header className="kb-card-editor-header">
        <div>
          <p className="kb-editor-eyebrow">{columnName || 'Card do quadro'}</p>
          <h2 id="kb-editor-title">{card.id ? 'Detalhes do card' : 'Novo card'}</h2>
        </div>
        <button type="button" aria-label="Fechar card" disabled={busy} onClick={requestClose}>
          <X size={18} />
        </button>
      </header>
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
      {changedElsewhere && (
        <div className="kb-card-conflict" role="status">
          <p>Este card foi atualizado enquanto você editava. Seu rascunho foi mantido.</p>
          <Button
            variant="outline"
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
        <p role="alert" className="kb-error">
          {error}
        </p>
      )}
      <div className="kb-card-editor-layout">
        <form
          className="kb-card-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (labelName.trim() || itemTitle.trim()) {
              setFieldError('Adicione ou limpe a etiqueta e o item de checklist antes de salvar.');
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
          }}
        >
          <fieldset disabled={busy || readOnly} className="kb-card-fields">
            <label className="kb-card-title-field">
              Título
              <input
                autoFocus
                required
                maxLength={200}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="O que precisa ser feito?"
              />
            </label>
            <div className="kb-card-properties">
              <label>
                <span>
                  <Flag size={15} aria-hidden="true" /> Prioridade
                </span>
                <select
                  value={details.prioridade}
                  onChange={(event) => updateDetails({ prioridade: event.target.value })}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Responsável
                <select value={assignee} onChange={(event) => setAssignee(event.target.value)}>
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
              </label>
              <label>
                <span>
                  <CalendarDays size={15} aria-hidden="true" /> Prazo de entrega
                </span>
                <input
                  type="date"
                  min="0001-01-01"
                  max="9999-12-31"
                  value={details.prazo}
                  onInput={(event) =>
                    updateDetails({ prazo: event.target.value, prazoConcluido: false })
                  }
                />
              </label>
              <div className="kb-card-completion">
                <label className="kb-inline-check">
                  <input
                    type="checkbox"
                    disabled={!details.prazo || busy}
                    checked={details.prazoConcluido}
                    onChange={(event) => updateDetails({ prazoConcluido: event.target.checked })}
                  />
                  Entrega concluída
                </label>
                {due && (
                  <span className="kb-due" data-state={due.key}>
                    {due.label} · {formatDueDate(details.prazo)}
                  </span>
                )}
              </div>
            </div>
            <label>
              <span className="kb-field-heading">
                <AlignLeft size={17} aria-hidden="true" /> Descrição
              </span>
              <textarea
                className="kb-description-input"
                maxLength={20000}
                value={details.descricao}
                onChange={(event) => updateDetails({ descricao: event.target.value })}
                placeholder="Detalhe o objetivo, o contexto e os critérios de entrega…"
              />
            </label>
            <section className="kb-card-section" aria-labelledby="kb-labels-title">
              <h3 id="kb-labels-title">
                <Tag size={17} aria-hidden="true" /> Etiquetas{' '}
                <span>{details.etiquetas.length}/12</span>
              </h3>
              <div className="kb-card-labels">
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
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              {details.etiquetas.length < 12 && (
                <div className="kb-inline-add">
                  <input
                    aria-label="Nome da etiqueta"
                    placeholder="Ex.: Cliente, Financeiro…"
                    maxLength={30}
                    value={labelName}
                    onChange={(event) => setLabelName(event.target.value)}
                    onKeyDown={(event) => addOnEnter(event, addLabel)}
                  />
                  <select
                    aria-label="Cor da etiqueta"
                    value={labelColor}
                    onChange={(event) => setLabelColor(event.target.value)}
                  >
                    {LABEL_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                  <button type="button" disabled={!labelName.trim()} onClick={addLabel}>
                    <Plus size={15} aria-hidden="true" /> Etiqueta
                  </button>
                </div>
              )}
            </section>
            <section className="kb-card-section" aria-labelledby="kb-checklist-title">
              <h3 id="kb-checklist-title">
                <CheckSquare size={17} aria-hidden="true" /> Checklist{' '}
                <span>
                  {completed}/{details.checklist.length}
                </span>
              </h3>
              {details.checklist.length > 0 && (
                <progress
                  max={100}
                  value={progress}
                  aria-label={`${progress}% do checklist concluído`}
                />
              )}
              <div className="kb-checklist-items">
                {details.checklist.map((item, index) => (
                  <div className="kb-checklist-item" key={item.id} data-completed={item.concluido}>
                    <input
                      type="checkbox"
                      aria-label={`Concluir ${item.titulo}`}
                      checked={item.concluido}
                      onChange={(event) =>
                        updateDetails({
                          checklist: details.checklist.map((row) =>
                            row.id === item.id ? { ...row, concluido: event.target.checked } : row,
                          ),
                        })
                      }
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
                    />
                    <button
                      type="button"
                      aria-label={`Remover item ${item.titulo}`}
                      onClick={() =>
                        updateDetails({
                          checklist: details.checklist.filter((row) => row.id !== item.id),
                        })
                      }
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              {details.checklist.length < 100 && (
                <div className="kb-inline-add">
                  <input
                    aria-label="Novo item do checklist"
                    maxLength={200}
                    placeholder="Adicionar uma etapa da tarefa…"
                    value={itemTitle}
                    onChange={(event) => setItemTitle(event.target.value)}
                    onKeyDown={(event) => addOnEnter(event, addItem)}
                  />
                  <button type="button" disabled={!itemTitle.trim()} onClick={addItem}>
                    <Plus size={15} aria-hidden="true" /> Item
                  </button>
                </div>
              )}
            </section>
          </fieldset>
          {fieldError && (
            <p role="alert" className="kb-error">
              {fieldError}
            </p>
          )}
          <footer className="kb-card-editor-footer">
            <p className="kb-hint">
              {dirty ? 'Alterações não salvas' : 'Nenhuma alteração pendente'}
            </p>
            <button type="button" disabled={busy} onClick={requestClose}>
              Cancelar
            </button>
            <Button
              variant="outline"
              type="submit"
              loading={saving}
              loadingText="Salvando card…"
              className="kb-button-primary"
              disabled={busy || readOnly || changedElsewhere || !title.trim()}
            >
              <Save size={16} aria-hidden="true" />
              Salvar card
            </Button>
          </footer>
        </form>
        <aside className="kb-card-editor-sidebar" aria-label="Conversa e ações do card">
          {card.id ? (
            <>
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
                onDelete={onDeleteComment}
                onDraftChange={setHasCommentDraft}
              />
              <CardActivity
                cardId={card.id}
                authApi={authApi}
                revision={`${latestCard?.updatedAt}:${comments.map((comment) => comment.id).join(',')}`}
              />
              {!readOnly && (
                <Button
                  variant="outline"
                  loading={archiving}
                  loadingText="Arquivando…"
                  disabled={busy}
                  onClick={() => (dirty ? setPendingAction('archive') : onArchive())}
                >
                  Arquivar card
                </Button>
              )}
              {!readOnly && (
                <div className="kb-card-danger-zone">
                  <p>A exclusão remove o card e todos os seus comentários.</p>
                  <button
                    type="button"
                    className="kb-button-danger"
                    disabled={busy}
                    onClick={onDelete}
                  >
                    <Trash2 size={15} aria-hidden="true" /> Excluir card
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="kb-hint">Salve o card para iniciar a conversa com a equipe.</p>
          )}
        </aside>
      </div>
    </EditorDialog>
  );
}
