/**
 * @file Orienta a seleção de cards e explica o efeito das ações em lote antes de aplicá-las.
 */
import { useId, useState } from 'react';
import { ListChecks } from 'lucide-react';

import { SectionIntro } from '@/components/section-intro';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

import { LABEL_COLORS } from '../lib/card-details';

const ACTION_HELP = {
  mover:
    'Move os cards marcados para a etapa escolhida. As regras de entrada dessa etapa continuam valendo.',
  atribuir:
    'Define o responsável dos cards marcados. Escolha “Sem responsável” para retirar a atribuição.',
  etiquetar: 'Adiciona a mesma etiqueta aos cards marcados, mantendo as demais etiquetas.',
  arquivar: 'Retira os cards marcados do quadro. Você pode recuperá-los pela opção “Arquivados”.',
};

export function BulkCardActions({
  enabled,
  onToggle,
  selected,
  onSelectVisible,
  columns,
  members,
  busy,
  onApply,
}) {
  const [action, setAction] = useState('mover');
  const titleId = useId();
  const descriptionId = useId();
  const panelId = useId();
  const actionHelpId = useId();

  return (
    <Card
      as="section"
      layout="plain"
      className="grid gap-3 p-3"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SectionIntro
          className="flex-1"
          title="Ações em vários cards"
          description="Selecione tarefas para mover de etapa, trocar o responsável, adicionar etiquetas ou arquivar de uma vez."
          icon={ListChecks}
          titleId={titleId}
          descriptionId={descriptionId}
        />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            size="sm"
            variant={enabled ? 'secondary' : 'outline'}
            disabled={busy}
            aria-expanded={enabled}
            aria-controls={panelId}
            onClick={onToggle}
          >
            {enabled ? 'Encerrar seleção' : 'Selecionar cards'}
          </Button>
          {enabled && (
            <>
              <span className="text-sm text-muted-foreground" role="status">
                {selected.length} selecionados (máximo 100)
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={onSelectVisible}
              >
                Selecionar resultados
              </Button>
            </>
          )}
        </div>
      </div>
      <div id={panelId} hidden={!enabled} className="grid gap-3">
        {enabled && (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Marque os cards no quadro ou use “Selecionar resultados” para escolher até 100 cards
              dos filtros atuais. Depois, defina a ação e clique em Aplicar.
            </p>
            <Form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(event) => {
                event.preventDefault();

                const form = new FormData(event.currentTarget);

                onApply({
                  acao: action,
                  ...(action === 'mover' && { colunaId: form.get('colunaId') }),
                  ...(action === 'atribuir' && {
                    responsavelId: form.get('responsavelId') || null,
                  }),
                  ...(action === 'etiquetar' && {
                    etiqueta: {
                      id: crypto.randomUUID(),
                      nome: String(form.get('nome')).trim(),
                      cor: form.get('cor'),
                    },
                  }),
                });
              }}
            >
              <div className="grid min-w-0 flex-1 gap-1.5 sm:min-w-40">
                <Label htmlFor="bulk-action">Ação</Label>
                <NativeSelect
                  id="bulk-action"
                  aria-describedby={actionHelpId}
                  value={action}
                  disabled={busy}
                  onChange={(event) => setAction(event.target.value)}
                >
                  <option value="mover">Mover para etapa</option>
                  <option value="atribuir">Definir responsável</option>
                  <option value="etiquetar">Adicionar etiqueta</option>
                  <option value="arquivar">Arquivar</option>
                </NativeSelect>
              </div>
              {action === 'mover' && (
                <div className="grid min-w-0 flex-1 gap-1.5 sm:min-w-40">
                  <Label htmlFor="bulk-column">Etapa de destino</Label>
                  <NativeSelect id="bulk-column" name="colunaId" disabled={busy}>
                    {columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.nome}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {action === 'atribuir' && (
                <div className="grid min-w-0 flex-1 gap-1.5 sm:min-w-40">
                  <Label htmlFor="bulk-assignee">Responsável dos cards</Label>
                  <NativeSelect id="bulk-assignee" name="responsavelId" disabled={busy}>
                    <option value="">Sem responsável</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.nome}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
              )}
              {action === 'etiquetar' && (
                <>
                  <div className="grid min-w-0 flex-1 gap-1.5">
                    <Label htmlFor="bulk-label">Nome da etiqueta</Label>
                    <Input id="bulk-label" name="nome" required maxLength={30} disabled={busy} />
                  </div>
                  <div className="grid min-w-0 flex-1 gap-1.5">
                    <Label htmlFor="bulk-color">Cor</Label>
                    <NativeSelect id="bulk-color" name="cor" disabled={busy}>
                      {LABEL_COLORS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </>
              )}
              <p
                id={actionHelpId}
                className="order-last w-full text-xs leading-relaxed text-muted-foreground"
                role="status"
              >
                {ACTION_HELP[action]}
              </p>
              <Button
                type="submit"
                disabled={busy || !selected.length}
                loading={busy}
                aria-describedby={actionHelpId}
              >
                Aplicar em {selected.length} cards
              </Button>
            </Form>
          </>
        )}
      </div>
    </Card>
  );
}
