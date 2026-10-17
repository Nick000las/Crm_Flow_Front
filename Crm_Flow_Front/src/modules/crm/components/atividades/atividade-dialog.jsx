import { useState } from 'react';
import { AcessoIndisponivel } from '@/components/acesso-indisponivel';
import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { semChave } from '@/lib/objetos';
import { getFieldError, isAccessError } from '@/services/api';
import { LIMITES_ATIVIDADE } from '../../constants';
import { useCriarAtividade, useEditarAtividade } from '../../hooks/use-atividades';
import { opcoesDeTipo, payloadDaAtividade, validarAtividade, valoresDaAtividade } from '../../lib/atividades';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';

const CAMPOS_DO_SERVIDOR = ['tipo', 'titulo', 'notas', 'agendadaPara'];
const INPUT_CLASS = 'h-9 rounded-none';

/** Montado só com o dialog aberto: cada abertura parte da atividade atual. */
function FormAtividade({ leadId, atividade, tipos, onSalvo }) {
  const editando = Boolean(atividade);
  const [valores, setValores] = useState(() => valoresDaAtividade(atividade));
  const [errosCliente, setErrosCliente] = useState({});
  const criar = useCriarAtividade(leadId);
  const editar = useEditarAtividade(leadId);
  const mutacao = editando ? editar : criar;

  const erroDe = (campo) => errosCliente[campo] ?? (mutacao.error ? getFieldError(mutacao.error, campo) : null);
  const erroSemCampo = mutacao.error && !CAMPOS_DO_SERVIDOR.some((campo) => getFieldError(mutacao.error, campo));

  function alterar(campo, valor) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    setErrosCliente((atuais) => semChave(atuais, campo));
    if (mutacao.error) mutacao.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const erros = validarAtividade(valores);
    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);
      return;
    }

    const corpo = payloadDaAtividade(valores, atividade);
    if (!corpo) {
      onSalvo(null);
      return;
    }
    if (editando) {
      editar.mutate({ id: atividade.id, parcial: corpo }, { onSuccess: () => onSalvo('Atividade atualizada.') });
      return;
    }
    const aviso = corpo.concluida ? 'Atividade registrada como concluída.' : 'Atividade registrada.';
    criar.mutate(corpo, { onSuccess: () => onSalvo(aviso) });
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={erroDe('tipo')} id="atividade-tipo" label="Tipo" obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(tipo) => alterar('tipo', tipo)}
            opcoes={opcoesDeTipo(tipos, atividade?.tipo)}
            value={valores.tipo}
          />
        )}
      </CampoForm>

      <CampoForm erro={erroDe('titulo')} id="atividade-titulo" label="Título" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className={INPUT_CLASS}
            maxLength={LIMITES_ATIVIDADE.TITULO}
            onChange={(event) => alterar('titulo', event.target.value)}
            placeholder="Ex.: Ligar para apresentar a proposta"
            value={valores.titulo}
          />
        )}
      </CampoForm>

      <CampoForm erro={erroDe('notas')} id="atividade-notas" label="Notas">
        {(controle) => (
          <Textarea
            {...controle}
            className="min-h-24 rounded-none"
            maxLength={LIMITES_ATIVIDADE.NOTAS}
            onChange={(event) => alterar('notas', event.target.value)}
            value={valores.notas}
          />
        )}
      </CampoForm>

      {!editando && (
        <div className="flex items-center gap-2">
          <Switch
            checked={valores.jaAconteceu}
            id="atividade-ja-aconteceu"
            onCheckedChange={(ligado) => alterar('jaAconteceu', ligado)}
          />
          <Label htmlFor="atividade-ja-aconteceu">Já aconteceu (registra como concluída agora)</Label>
        </div>
      )}

      {!valores.jaAconteceu && (
        <CampoForm erro={erroDe('agendadaPara')} id="atividade-agenda" label="Agendada para">
          {(controle) => (
            <Input
              {...controle}
              className={`${INPUT_CLASS} font-mono tabular-nums`}
              onChange={(event) => alterar('agendadaPara', event.target.value)}
              type="datetime-local"
              value={valores.agendadaPara}
            />
          )}
        </CampoForm>
      )}

      {erroSemCampo && <ApiErrorAlert error={mutacao.error} id="atividade-erro" title="Não foi possível salvar" />}

      <DialogFooter>
        <DialogClose render={<Button disabled={mutacao.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={mutacao.isPending} disabled={mutacao.isPending} type="submit">
          {mutacao.isPending ? 'Salvando…' : editando ? 'Salvar alterações' : 'Registrar'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Registrar ou editar uma atividade. Os tipos vêm da lista `tipo_atividade`
 * (Configurações › Listas); sem acesso a ela, o dialog explica em vez do form.
 *
 * @param {{
 *   leadId: string,
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   atividade?: import('../../api/atividades.api').Atividade | null,
 *   tipos: import('../../lib/opcoes').Opcao[] | undefined,
 *   erroDosTipos: unknown,
 *   onSalvo: (aviso: string | null) => void,
 * }} props `onSalvo(null)` = nada mudou
 */
export function AtividadeDialog({ leadId, open, onOpenChange, atividade, tipos, erroDosTipos, onSalvo }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{atividade ? 'Editar atividade' : 'Registrar atividade'}</DialogTitle>
          <DialogDescription>Ligação, reunião, tarefa: o que foi ou vai ser feito com este lead.</DialogDescription>
        </DialogHeader>
        {open &&
          (isAccessError(erroDosTipos) ? (
            <AcessoIndisponivel error={erroDosTipos} />
          ) : erroDosTipos ? (
            <ApiErrorAlert error={erroDosTipos} id="atividade-tipos-erro" title="Não foi possível carregar os tipos" />
          ) : (
            <FormAtividade
              atividade={atividade}
              key={atividade?.id ?? 'nova'}
              leadId={leadId}
              onSalvo={(aviso) => {
                onOpenChange(false);
                onSalvo(aviso);
              }}
              tipos={tipos}
            />
          ))}
      </DialogContent>
    </Dialog>
  );
}
