import { useState } from 'react';
import { LoadingState } from '@/components/loading-state';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, Trash2 } from 'lucide-react';

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
  onDraftChange,
}) {
  const [content, setContent] = useState('');
  const [mentioned, setMentioned] = useState([]);
  return (
    <section className="kb-card-comments" aria-labelledby="kb-comments-title">
      <h3 id="kb-comments-title">
        <MessageSquare size={17} aria-hidden="true" /> Comentários <span>{comments.length}</span>
      </h3>
      {!readOnly && (
        <form
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
              onDraftChange(false);
            }
          }}
        >
          <label>
            Escreva um comentário
            <textarea
              name="conteudo"
              value={content}
              onChange={(event) => {
                setContent(event.target.value);
                onDraftChange(Boolean(event.target.value));
              }}
              placeholder="Compartilhe uma atualização com a equipe…"
              required
              maxLength={10000}
              disabled={busy}
            />
          </label>
          <label>
            Mencionar participante
            <select
              disabled={busy}
              value=""
              onChange={(event) => {
                const member = members.find((item) => item.id === event.target.value);
                if (member) {
                  setContent((value) => `${value}${value ? ' ' : ''}@${member.nome} `);
                  setMentioned((current) =>
                    current.some((item) => item.id === member.id) ? current : [...current, member],
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
            </select>
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
        </form>
      )}
      {loading && <LoadingState inline label="Carregando comentários…" />}
      {error && (
        <p role="alert" className="kb-error">
          {error}
        </p>
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
          <p>
            {comment.conteudo.replace(
              /@\{([0-9a-f-]{36})\}/gi,
              (_, id) => `@${members.find((m) => m.id === id)?.nome || 'participante'}`,
            )}
          </p>
          {!readOnly && (canManage || comment.usuarioId === userId) && (
            <button
              className="kb-button-danger"
              type="button"
              disabled={busy}
              onClick={() => onDelete(comment.id)}
            >
              <Trash2 size={13} aria-hidden="true" /> Excluir comentário
            </button>
          )}
        </article>
      ))}
    </section>
  );
}
