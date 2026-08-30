import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/loading-state';
import { useState } from 'react';
import { BOARD_LAYOUTS } from '../lib/board-layouts';
import { TeamMemberPicker } from './team-member-picker';
import { X } from 'lucide-react';
import { EditorDialog } from './editor-dialog';

export function BoardSettingsForm({
  board,
  members,
  membersLoading = false,
  membersError,
  onRetryMembers,
  busy,
  saving = false,
  error,
  onSave,
  onClose,
}) {
  const [permissions, setPermissions] = useState(() =>
    Object.fromEntries(
      (board.participantes ?? []).map((member) => [member.id, member.permissao ?? 'editor']),
    ),
  );
  const [layoutId, setLayoutId] = useState('basico');
  const selectedLayout = BOARD_LAYOUTS.find((layout) => layout.id === layoutId);
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(
        board.participantes?.filter((member) => member.ativo).map((member) => member.id) ?? [],
      ),
  );
  const inactiveMembers = board.participantes?.filter((member) => !member.ativo) ?? [];

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSave({
      nome: form.get('nome').trim(),
      ...(!board.id && {
        boardType: form.get('boardType'),
        colunasIniciais: selectedLayout.colunas,
      }),
      participantes: [...selectedIds],
      permissoes: [...selectedIds].map((id) => ({ id, permissao: permissions[id] ?? 'editor' })),
    });
  }

  return (
    <EditorDialog
      busy={busy}
      onClose={onClose}
      titleId="board-settings-title"
      className="kb-board-settings"
    >
      <header>
        <h2 id="board-settings-title">{board.id ? 'Editar quadro e equipe' : 'Novo quadro'}</h2>
        <button type="button" aria-label="Fechar" disabled={busy} onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <form onSubmit={submit}>
        <fieldset disabled={busy} className="kb-settings-fields">
          <label>
            Nome do quadro
            <input autoFocus name="nome" required maxLength={200} defaultValue={board.nome ?? ''} />
          </label>
          {!board.id && (
            <label>
              Tipo do quadro
              <select name="boardType" defaultValue="projetos">
                <option value="projetos">Projetos</option>
                <option value="crm_leads">CRM</option>
                <option value="postagens_agencia">Postagens</option>
              </select>
            </label>
          )}
          {!board.id && (
            <fieldset className="kb-layout-options" aria-describedby="board-layout-help">
              <legend>Comece com um modelo</legend>
              <p id="board-layout-help" className="kb-hint">
                Escolha as colunas iniciais. Você pode renomear e adicionar etapas depois. O modelo
                não altera o tipo do quadro nem cria cards.
              </p>
              <div className="kb-layout-grid">
                {BOARD_LAYOUTS.map((layout) => (
                  <label key={layout.id} className="kb-layout-option">
                    <span className="kb-layout-heading">
                      <input
                        type="radio"
                        name="layout"
                        value={layout.id}
                        checked={layoutId === layout.id}
                        onChange={() => setLayoutId(layout.id)}
                      />
                      <strong>{layout.nome}</strong>
                    </span>
                    <span className="kb-layout-description">{layout.descricao}</span>
                    <span className="kb-layout-preview" aria-hidden="true">
                      {layout.colunas.map((column) => (
                        <span key={column} />
                      ))}
                      {layout.colunas.length === 0 && <span className="kb-layout-blank" />}
                    </span>
                  </label>
                ))}
              </div>
              <div className="kb-layout-stages" aria-live="polite" aria-atomic="true">
                <strong>Colunas de {selectedLayout.nome}</strong>
                {selectedLayout.colunas.length ? (
                  <ol>
                    {selectedLayout.colunas.map((column) => (
                      <li key={column}>{column}</li>
                    ))}
                  </ol>
                ) : (
                  <p>Nenhuma coluna inicial.</p>
                )}
              </div>
            </fieldset>
          )}
          <fieldset
            className="kb-team-options"
            disabled={membersLoading}
            aria-busy={membersLoading}
            aria-describedby="board-team-help"
          >
            <legend>Participantes do quadro</legend>
            <p id="board-team-help" className="kb-hint">
              Os participantes podem trabalhar nos cards e receber atribuições. Donos e
              administradores têm acesso à gestão de todos os quadros.
              {!board.id && ' Você também será incluído na equipe ao criar o quadro.'}
            </p>
            {membersLoading && <LoadingState inline label="Carregando participantes…" />}
            {membersError && (
              <div>
                <p role="alert" className="kb-error">
                  {membersError}
                </p>
                <Button type="button" variant="outline" onClick={onRetryMembers}>
                  Tentar carregar participantes novamente
                </Button>
              </div>
            )}
            {!membersLoading && !membersError && members.length === 0 && (
              <p>Nenhum usuário ativo disponível.</p>
            )}
            {!membersLoading && !membersError && members.length > 0 && (
              <TeamMemberPicker
                members={members}
                selectedIds={selectedIds}
                onChange={setSelectedIds}
                permissions={permissions}
                onPermissionChange={(id, permissao) =>
                  setPermissions((value) => ({ ...value, [id]: permissao }))
                }
              />
            )}
          </fieldset>
        </fieldset>
        {board.id && (
          <p className="kb-hint">
            Ao remover um participante, os cards atribuídos a ele ficarão sem responsável. Sem
            participantes, o quadro fica acessível somente a donos e administradores.
          </p>
        )}
        {inactiveMembers.length > 0 && (
          <p className="kb-hint">
            Usuários inativos serão removidos da equipe ao salvar:{' '}
            {inactiveMembers.map((member) => member.nome).join(', ')}.
          </p>
        )}
        {error && (
          <p role="alert" className="kb-error">
            {error}
          </p>
        )}
        <footer className="kb-actions">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancelar
          </button>
          <Button
            variant="outline"
            type="submit"
            disabled={busy || membersLoading || Boolean(membersError)}
            loading={saving}
            loadingText="Salvando quadro…"
          >
            Salvar quadro
          </Button>
        </footer>
      </form>
    </EditorDialog>
  );
}
