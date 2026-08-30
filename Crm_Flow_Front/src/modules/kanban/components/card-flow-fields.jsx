/**
 * @file Edita próxima ação, motivo do bloqueio e dependências do card dentro do formulário
 * compartilhado.
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

export function CardFlowFields({ cardId, details, onChange, cards, members }) {
  const action = details.proximaAcao;
  const dependencies = details.dependencias ?? [];
  const available = cards.filter(
    (card) => card.id !== cardId && !card.archivedAt && !dependencies.includes(card.id),
  );

  return (
    <div className="grid min-w-0 gap-5 border-t border-border pt-5">
      <section className="grid gap-3" aria-label="Próxima ação">
        <Label className="flex items-center gap-2">
          <Checkbox
            checked={Boolean(action)}
            onCheckedChange={(checked) =>
              onChange({
                proximaAcao: checked
                  ? { titulo: '', data: '', lembrar: false, concluida: false }
                  : null,
              })
            }
          />
          Definir próxima ação
        </Label>
        {action && (
          <>
            <div className="grid gap-1.5">
              <Label htmlFor="next-action-title">O que fazer</Label>
              <Input
                id="next-action-title"
                value={action.titulo}
                maxLength={200}
                placeholder="Ex.: Ligar para o cliente"
                onChange={(event) =>
                  onChange({ proximaAcao: { ...action, titulo: event.target.value } })
                }
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="next-action-date">Data da próxima ação</Label>
              <Input
                id="next-action-date"
                type="date"
                value={action.data}
                onChange={(event) =>
                  onChange({ proximaAcao: { ...action, data: event.target.value } })
                }
              />
            </div>
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={action.lembrar}
                onCheckedChange={(lembrar) => onChange({ proximaAcao: { ...action, lembrar } })}
              />
              Lembrar o responsável por e-mail
            </Label>
            <p className="text-xs text-muted-foreground">
              O lembrete segue as preferências de e-mail do responsável e é enviado na data da ação.
            </p>
            <Label className="flex items-center gap-2">
              <Checkbox
                checked={action.concluida}
                onCheckedChange={(concluida) => onChange({ proximaAcao: { ...action, concluida } })}
              />
              Ação concluída
            </Label>
          </>
        )}
      </section>
      <section className="grid gap-2" aria-label="Bloqueio do card">
        <Label htmlFor="kb-card-blocker">Motivo do bloqueio</Label>
        <Textarea
          id="kb-card-blocker"
          value={details.bloqueio ?? ''}
          maxLength={500}
          rows={2}
          placeholder="Deixe vazio para desbloquear"
          onChange={(event) => onChange({ bloqueio: event.target.value })}
        />
        {details.bloqueio && (
          <>
            <Label htmlFor="blocker-owner">Quem precisa resolver</Label>
            <NativeSelect
              id="blocker-owner"
              value={details.bloqueioResponsavelId ?? ''}
              onChange={(event) => onChange({ bloqueioResponsavelId: event.target.value || null })}
            >
              <option value="">Não definido</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.nome}
                </option>
              ))}
            </NativeSelect>
            <p className="text-xs text-muted-foreground">
              Resolva o bloqueio para mover ou concluir o card.
            </p>
          </>
        )}
      </section>
      <section className="grid gap-2" aria-label="Dependências do card">
        <Label htmlFor="card-dependency">Depende da conclusão de</Label>
        <NativeSelect
          id="card-dependency"
          value=""
          disabled={dependencies.length >= 50 || !available.length}
          onChange={(event) =>
            event.target.value && onChange({ dependencias: [...dependencies, event.target.value] })
          }
        >
          <option value="">
            {available.length ? 'Adicionar dependência…' : 'Nenhum outro card disponível'}
          </option>
          {available.map((card) => (
            <option key={card.id} value={card.id}>
              {card.titulo}
            </option>
          ))}
        </NativeSelect>
        <ul className="grid gap-2">
          {dependencies.map((id) => {
            const dependency = cards.find((card) => card.id === id);

            return (
              <li
                key={id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm"
              >
                <span className="min-w-0 break-words">
                  {dependency?.titulo ?? 'Dependência indisponível'}{' '}
                  <Badge variant="secondary">
                    {dependency?.dadosExtras?.prazoConcluido ? 'Concluída' : 'Pendente'}
                  </Badge>
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onChange({ dependencias: dependencies.filter((item) => item !== id) })
                  }
                  aria-label={`Remover dependência ${dependency?.titulo ?? id}`}
                >
                  Remover
                </Button>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-muted-foreground">
          Cards dependentes só avançam quando as tarefas vinculadas forem concluídas.
        </p>
      </section>
    </div>
  );
}
