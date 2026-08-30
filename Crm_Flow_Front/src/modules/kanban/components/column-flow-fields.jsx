/**
 * @file Campos nativos nomeados: o formulário mantém uma única fonte de envio.
 */
import { ShieldCheck, Zap } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';

/** Campos nativos nomeados: o formulário mantém uma única fonte de envio. */
export function ColumnFlowFields({ rules = {}, members }) {
  const automation = rules.automacao ?? {};

  return (
    <div className="space-y-4">
      <fieldset className="space-y-3.5 rounded-xl border border-border/80 bg-muted/25 p-4">
        <legend className="sr-only">Regras para entrar nesta etapa</legend>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <ShieldCheck className="size-3.5 text-foreground/80" aria-hidden="true" />
          Regras para entrar nesta etapa
        </div>

        <div className="space-y-2.5">
          {[
            ['exigirResponsavel', 'Exigir responsável'],
            ['exigirPrazo', 'Exigir prazo'],
            ['exigirChecklist', 'Exigir checklist preenchido e concluído'],
          ].map(([key, label]) => (
            <Label
              key={key}
              className="flex cursor-pointer items-center gap-2.5 text-sm font-normal text-foreground"
            >
              <Checkbox name={key} defaultChecked={Boolean(rules[key])} />
              <span>{label}</span>
            </Label>
          ))}
        </div>

        <div className="space-y-1.5 border-t border-border/60 pt-3">
          <Label htmlFor="stage-stale-days" className="text-xs font-medium text-muted-foreground">
            Destacar cards parados após (dias)
          </Label>
          <Input
            id="stage-stale-days"
            name="diasSemMovimento"
            type="number"
            min={1}
            max={365}
            defaultValue={rules.diasSemMovimento === null ? '' : (rules.diasSemMovimento ?? 7)}
            placeholder="Sem destaque"
            className="max-w-[11rem]"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3.5 rounded-xl border border-border/80 bg-muted/25 p-4">
        <legend className="sr-only">Automação ao entrar nesta etapa</legend>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <Zap className="size-3.5 text-primary" aria-hidden="true" />
          Automação ao entrar nesta etapa
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="stage-assignee" className="text-xs font-medium text-muted-foreground">
              Atribuir responsável
            </Label>
            <NativeSelect
              id="stage-assignee"
              name="automacaoResponsavel"
              defaultValue={automation.responsavelId ?? ''}
            >
              <option value="">Manter responsável</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.nome}
                </option>
              ))}
            </NativeSelect>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="stage-due-days" className="text-xs font-medium text-muted-foreground">
              Definir prazo em dias
            </Label>
            <Input
              id="stage-due-days"
              name="automacaoPrazoDias"
              type="number"
              min={0}
              max={365}
              defaultValue={automation.prazoDias ?? ''}
              placeholder="Manter prazo"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="stage-new-task" className="text-xs font-medium text-muted-foreground">
            Criar tarefa nesta etapa
          </Label>
          <Input
            id="stage-new-task"
            name="automacaoTarefa"
            maxLength={200}
            defaultValue={automation.tarefa ?? ''}
            placeholder="Título da nova tarefa (opcional)"
          />
        </div>

        <Label className="flex cursor-pointer items-center gap-2.5 text-sm font-normal text-foreground">
          <Checkbox name="automacaoConcluir" defaultChecked={Boolean(automation.concluir)} />
          <span>Concluir o card automaticamente</span>
        </Label>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Executa uma vez por entrada na etapa, após validar suas regras. A nova tarefa recebe
          responsável e prazo da automação. Regras específicas do card têm prioridade.
        </p>
      </fieldset>
    </div>
  );
}
