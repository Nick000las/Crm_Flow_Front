/**
 * @file Edita os dados e a equipe do quadro, incluindo o usuário atual como editor sem seleção
 * manual.
 */
import { useState } from 'react';
import { Info, X } from 'lucide-react';

import { FieldError } from '@/components/field-error';
import { LoadingState } from '@/components/loading-state';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Radio } from '@/components/ui/radio';
import { focusFirstInvalidField, validateRequired } from '@/lib/form-validation';
import { cn } from '@/lib/utils';

import { BOARD_LAYOUTS } from '../lib/board-layouts';
import { EditorDialog } from './editor-dialog';
import { TeamMemberPicker } from './team-member-picker';

export function BoardSettingsForm({
  board,
  currentUser,
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
  const [nameError, setNameError] = useState(null);
  const selectedLayout = BOARD_LAYOUTS.find((layout) => layout.id === layoutId);
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(
        board.participantes
          ?.filter((member) => member.ativo && member.id !== currentUser?.id)
          .map((member) => member.id) ?? [],
      ),
  );
  const selectableMembers = members.filter((member) => member.id !== currentUser?.id);
  const inactiveMembers =
    board.participantes?.filter((member) => !member.ativo && member.id !== currentUser?.id) ?? [];

  function submit(event) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const nome = String(form.get('nome') ?? '').trim();
    const validationError = validateRequired(nome, 'O nome do quadro');

    if (validationError) {
      setNameError(validationError);
      focusFirstInvalidField(formElement, ['nome']);

      return;
    }

    setNameError(null);

    const participantIds = [
      ...new Set([...selectedIds, ...(currentUser?.id ? [currentUser.id] : [])]),
    ];

    onSave({
      nome,
      ...(!board.id && {
        boardType: form.get('boardType'),
        colunasIniciais: selectedLayout.colunas,
      }),
      participantes: participantIds,
      permissoes: participantIds.map((id) => ({
        id,
        permissao: id === currentUser?.id ? 'editor' : (permissions[id] ?? 'editor'),
      })),
    });
  }

  return (
    <EditorDialog
      busy={busy}
      onClose={onClose}
      titleId="board-settings-title"
      className="kb-board-settings !w-[min(42rem,calc(100vw-2rem))] !p-0"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div className="min-w-0">
          <h2
            id="board-settings-title"
            className="text-base font-semibold tracking-tight text-foreground"
          >
            {board.id ? 'Editar quadro e equipe' : 'Novo quadro'}
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {board.id
              ? 'Atualize o nome do quadro e gerencie quem pode editar ou visualizar.'
              : 'Configure o nome, o modelo inicial de colunas e a equipe do quadro.'}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Fechar"
          disabled={busy}
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <Form noValidate onSubmit={submit} className="!m-0 !gap-0">
        <div className="space-y-5 px-6 py-5">
          <fieldset disabled={busy} className="space-y-5">
            <div className={cn('grid gap-4', !board.id && 'sm:grid-cols-[1fr_11rem]')}>
              <div className="grid gap-1.5">
                <Label htmlFor="board-name-input">Nome do quadro</Label>
                <Input
                  id="board-name-input"
                  autoFocus
                  name="nome"
                  maxLength={200}
                  defaultValue={board.nome ?? ''}
                  placeholder="Ex.: Operação comercial"
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={nameError ? 'board-name-error' : undefined}
                  onChange={() => setNameError(null)}
                  className="h-9.5"
                />
                <FieldError id="board-name-error" message={nameError} />
              </div>

              {!board.id && (
                <div className="grid gap-1.5">
                  <Label htmlFor="board-type-select">Tipo</Label>
                  <div className="relative">
                    <NativeSelect
                      id="board-type-select"
                      name="boardType"
                      defaultValue="projetos"
                      className="h-9.5 w-full cursor-pointer pr-8 pl-2.5 text-sm hover:border-border-strong"
                    >
                      <option value="projetos">Projetos</option>
                      <option value="crm_leads">CRM</option>
                      <option value="postagens_agencia">Postagens</option>
                    </NativeSelect>
                  </div>
                </div>
              )}
            </div>

            {!board.id && (
              <div className="space-y-3 rounded-xl border border-border bg-surface/60 p-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Comece com um modelo</p>
                  <p id="board-layout-help" className="mt-0.5 text-xs text-muted-foreground">
                    Escolha as colunas iniciais. Você pode renomear e adicionar etapas depois.
                  </p>
                </div>

                <div
                  className="grid gap-2.5 sm:grid-cols-2"
                  role="radiogroup"
                  aria-describedby="board-layout-help"
                >
                  {BOARD_LAYOUTS.map((layout) => {
                    const active = layoutId === layout.id;

                    return (
                      <label
                        key={layout.id}
                        className={cn(
                          'flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3 text-left transition-colors',
                          active
                            ? 'border-primary bg-primary/[0.05]'
                            : 'border-border bg-card hover:border-border-strong',
                        )}
                      >
                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Radio
                            name="layout"
                            value={layout.id}
                            checked={active}
                            onChange={() => setLayoutId(layout.id)}
                          />
                          <span>{layout.nome}</span>
                        </span>
                        <span className="text-xs leading-relaxed text-muted-foreground">
                          {layout.descricao}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div
                  className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3 text-xs"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span className="font-medium text-muted-foreground">Etapas iniciais:</span>
                  {selectedLayout.colunas.length ? (
                    selectedLayout.colunas.map((column) => (
                      <Badge key={column} variant="secondary" className="font-normal">
                        {column}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Nenhuma coluna inicial.</span>
                  )}
                </div>
              </div>
            )}

            <section
              className="space-y-4 rounded-xl border border-border bg-surface/60 p-4"
              aria-busy={membersLoading}
              aria-describedby="board-team-help"
            >
              <div>
                <h3 className="text-sm font-semibold text-foreground">Participantes do quadro</h3>
                <p
                  id="board-team-help"
                  className="mt-0.5 text-xs leading-relaxed text-muted-foreground"
                >
                  Os participantes podem trabalhar nos cards e receber atribuições. Donos e
                  administradores têm acesso à gestão de todos os quadros.
                </p>
              </div>

              {currentUser?.id && (
                <p className="text-xs text-muted-foreground">
                  Você ({currentUser.nome}) terá permissão para editar automaticamente. Selecione
                  abaixo os demais participantes.
                </p>
              )}

              {membersLoading && <LoadingState inline label="Carregando participantes…" />}

              {membersError && (
                <div className="space-y-2.5">
                  <Alert variant="destructive" role="alert" className="!m-0">
                    {membersError}
                  </Alert>
                  <Button type="button" size="sm" variant="outline" onClick={onRetryMembers}>
                    Tentar carregar participantes novamente
                  </Button>
                </div>
              )}

              {!membersLoading && !membersError && selectableMembers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum outro usuário ativo disponível.
                </p>
              )}

              {!membersLoading && !membersError && selectableMembers.length > 0 && (
                <TeamMemberPicker
                  members={selectableMembers}
                  selectedIds={selectedIds}
                  onChange={setSelectedIds}
                  permissions={permissions}
                  onPermissionChange={(id, permissao) =>
                    setPermissions((value) => ({ ...value, [id]: permissao }))
                  }
                />
              )}
            </section>
          </fieldset>

          {board.id && (
            <div className="flex items-start gap-2.5 rounded-lg border border-border bg-surface/70 px-3.5 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <p>
                Ao remover um participante, os cards atribuídos a ele ficarão sem responsável. Seu
                acesso de edição é incluído automaticamente ao salvar.
              </p>
            </div>
          )}

          {inactiveMembers.length > 0 && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-3.5 py-2.5 text-xs text-warning-foreground dark:text-warning">
              Usuários inativos serão removidos da equipe ao salvar:{' '}
              {inactiveMembers.map((member) => member.nome).join(', ')}.
            </div>
          )}

          {error && (
            <Alert variant="destructive" role="alert" className="!m-0">
              {error}
            </Alert>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border bg-surface px-6 py-3.5">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={busy || membersLoading || Boolean(membersError)}
            loading={saving}
            loadingText="Salvando quadro…"
          >
            Salvar quadro
          </Button>
        </footer>
      </Form>
    </EditorDialog>
  );
}
