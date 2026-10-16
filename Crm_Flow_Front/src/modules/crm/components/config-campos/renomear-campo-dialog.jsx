import { useState } from 'react';
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
import { getFieldError } from '@/services/api';
import { useAtualizarCampoConfigurado } from '../../hooks/use-configuracoes-campos';
import { parcialDoNome } from '../../lib/configuracoes-campos';
import { CampoForm } from '../campo-form';

const NOME_VAZIO = 'Informe um nome.';

/** Montado só com o dialog aberto: cada abertura começa do nome atual. */
function FormRenomear({ campo, onSalvo }) {
  const [label, setLabel] = useState(campo.label);
  const [erroCliente, setErroCliente] = useState(null);
  const atualizar = useAtualizarCampoConfigurado();
  const erroDoNome = erroCliente ?? (atualizar.error ? getFieldError(atualizar.error, 'label') : null);
  const renomeado = Boolean(campo.labelPadrao) && campo.label !== campo.labelPadrao;

  function enviar(parcial) {
    if (!parcial) {
      onSalvo(null);
      return;
    }
    atualizar.mutate({ id: campo.id, parcial }, { onSuccess: (atualizado) => onSalvo(atualizado) });
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (label.trim() === '') {
      setErroCliente(NOME_VAZIO);
      return;
    }
    enviar(parcialDoNome(campo, label));
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={erroDoNome} id="renomear-campo-label" label="Nome do campo" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className="h-9 rounded-none"
            onChange={(event) => {
              setLabel(event.target.value);
              setErroCliente(null);
              if (atualizar.error) atualizar.reset();
            }}
            value={label}
          />
        )}
      </CampoForm>

      <p className="-mt-2 text-xs text-muted-foreground">
        Chave <span className="font-mono text-foreground select-all">{campo.chave}</span> — a API e as
        planilhas continuam usando a chave.
        {campo.labelPadrao && (
          <>
            {' '}
            Nome padrão: <span className="text-foreground">{campo.labelPadrao}</span>.
          </>
        )}
      </p>

      {atualizar.error && !getFieldError(atualizar.error, 'label') && (
        <ApiErrorAlert error={atualizar.error} id="renomear-campo-erro" title="Não foi possível renomear" />
      )}

      <DialogFooter>
        {renomeado && (
          <Button
            className="sm:mr-auto"
            disabled={atualizar.isPending}
            onClick={() => enviar({ label: null })}
            type="button"
            variant="ghost"
          >
            Restaurar nome padrão
          </Button>
        )}
        <DialogClose render={<Button disabled={atualizar.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={atualizar.isPending} disabled={atualizar.isPending} type="submit">
          {atualizar.isPending ? 'Salvando…' : 'Salvar nome'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Renomear um campo do sistema. Muda só o rótulo exibido nas telas.
 *
 * @param {{
 *   campo: import('../../types').CampoConfigurado | null,
 *   onOpenChange: (open: boolean) => void,
 *   onSalvo: (atualizado: import('../../types').CampoConfigurado | null) => void,
 * }} props aberto enquanto houver `campo`; `onSalvo(null)` = nada mudou
 */
export function RenomearCampoDialog({ campo, onOpenChange, onSalvo }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(campo)}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Renomear campo</DialogTitle>
          <DialogDescription>O novo nome aparece no formulário, na ficha, nos filtros e na tabela.</DialogDescription>
        </DialogHeader>
        {campo && (
          <FormRenomear
            campo={campo}
            key={campo.id}
            onSalvo={(atualizado) => {
              onOpenChange(false);
              onSalvo(atualizado);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
