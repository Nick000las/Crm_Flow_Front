/**
 * @file Renderiza card comments, na área de Kanban, expondo os estados e eventos necessários à
 * interface.
 */
import { useState } from 'react';
import { MessageSquare, Send, Trash2 } from 'lucide-react';

import { LoadingState } from '@/components/loading-state';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

export function CardComments({
  comments,
  members = [],
  readOnly = false,
  loading = false,
  submitting = false,
  error,
  busy,
  canManage,
  userId,
  onComment,
  onDelete,
  onEdit,
  onDraftChange,
}) {
  const [editing, setEditing] = useState(null);
  const [editText, setEditText] = useState('');
  const [content, setContent] = useState('');
  const [mentioned, setMentioned] = useState([]);

  return (
    <section className="kb-card-comments" aria-labelledby="kb-comments-title">
      <h3 id="kb-comments-title">
        <MessageSquare size={17} aria-hidden="true" /> Comentários <span>{comments.length}</span>
      </h3>
      {!readOnly && (
        <Form
          noValidate
          onSubmit={async (event) => {
            event.preventDefault();

            const form = event.currentTarget;
            const content = new FormData(form).get('conteudo').trim();

            if (
              content &&
              (await onComment(
                content,
                mentioned.map((member) => member.id),
              ))
            ) {
              setContent('');
              setMentioned([]);
              form.reset();
              onDraftChange(Boolean(editing));
            }
          }}
        >
          <label>
            Escreva um comentário
            <Textarea
              name="conteudo"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                onDraftChange(Boolean(event.target.value) || Boolean(editing));
              }}
              placeholder="Compartilhe uma atualização com a equipe…"
              required
              maxLength={10000}
              disabled={busy}
            />
          </label>
          <label>
            Mencionar participante
            <div className="relative">
              <NativeSelect
                disabled={busy}
                value=""
                className="w-full pr-8"
                onChange={(event) => {
                  const member = members.find((item) => item.id === event.target.value);

                  if (member) {
                    setContent((value) => `${value}${value ? ' ' : ''}@${member.nome} `);

                    setMentioned((current) =>
                      current.some((item) => item.id === member.id)
                        ? current
                        : [...current, member],
                    );

                    onDraftChange(true);
                  }
                }}
              >
                <option value="">Escolher participante…</option>
                {members
                  .filter((m) => m.id !== userId)
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.nome}
                    </option>
                  ))}
              </NativeSelect>
            </div>
          </label>
          {mentioned.length > 0 && (
            <div className="kb-mention-recipients">
              <span>Notificar:</span>
              {mentioned.map((member) => (
                <Button
                  key={member.id}
                  type="button"
                  variant="outline"
                  disabled={busy}
                  aria-label={`Remover menção de ${member.nome}`}
                  onClick={() =>
                    setMentioned((current) => current.filter((m) => m.id !== member.id))
                  }
                >
                  {member.nome} ×
                </Button>
              ))}
            </div>
          )}
          <Button
            variant="outline"
            disabled={busy}
            type="submit"
            loading={submitting}
            loadingText="Enviando comentário…"
          >
            <Send size={15} aria-hidden="true" /> Comentar
          </Button>
        </Form>
      )}
      {loading && <LoadingState inline label="Carregando comentários…" />}
      {error && (
        <Alert variant="destructive" role="alert">
          {error}
        </Alert>
      )}
      {!loading && !error && comments.length === 0 && (
        <p className="kb-hint">As conversas da equipe sobre este card aparecerão aqui.</p>
      )}
      {comments.map((comment) => (
        <article className="kb-comment" key={comment.id}>
          <div className="kb-comment-heading">
            <strong>{comment.autor || 'Usuário'}</strong>
            <time dateTime={comment.createdAt}>
              {new Date(comment.createdAt).toLocaleString('pt-BR')}
            </time>
          </div>
          {editing === comment.id ? (
            <Form
              noValidate
              onSubmit={async (event) => {
                event.preventDefault();

                if (editText.trim() && (await onEdit(comment.id, editText.trim()))) {
                  setEditing(null);
                  onDraftChange(Boolean(content));
                }
              }}
            >
              <label>
                Editar comentário
                <Textarea
                  value={editText}
                  maxLength={10000}
                  disabled={busy}
                  onChange={(event) => {
                    setEditText(event.target.value);
                    onDraftChange(true);
                  }}
                />
              </label>
              <Button type="submit" disabled={busy || !editText.trim()}>
                Salvar comentário
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setEditing(null);
                  onDraftChange(Boolean(content));
                }}
              >
                Cancelar edição
              </Button>
            </Form>
          ) : (
            <p>
              {comment.conteudo.replace(
                /@\{([0-9a-f-]{36})\}/gi,
                (_, id) => `@${members.find((m) => m.id === id)?.nome || 'participante'}`,
              )}
            </p>
          )}
          {comment.editedAt && (
            <small>Editado em {new Date(comment.editedAt).toLocaleString('pt-BR')}</small>
          )}
          {!readOnly && comment.usuarioId === userId && !editing && (
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setEditing(comment.id);
                setEditText(comment.conteudo);
                onDraftChange(true);
              }}
            >
              Editar comentário
            </Button>
          )}
          {!readOnly && (canManage || comment.usuarioId === userId) && (
            <Button
              variant="destructive"
              size="sm"
              type="button"
              disabled={busy}
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 size={13} aria-hidden="true" /> Excluir comentário
            </Button>
          )}
        </article>
      ))}
    </section>
  );
}
