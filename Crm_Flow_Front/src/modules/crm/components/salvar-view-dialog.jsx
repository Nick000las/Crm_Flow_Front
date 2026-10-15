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
import { useSalvarView } from '../hooks/use-views';
import { CampoForm } from './campo-form';

const NOME_ID = 'salvar-view-nome';
const ERRO_ID = 'salvar-view-erro';

/**
 * "Salvar visão atual…": guarda busca + filtro com um nome. Nome repetido
 * volta como 409 e aparece no próprio campo.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   filtros: object,
 * }} props `filtros` é o corpo salvo (filtro aplicado + `busca`)
 */
export function SalvarViewDialog({ open, onOpenChange, filtros }) {
  const [nome, setNome] = useState('');
  const salvar = useSalvarView();
  const erroNome = salvar.error ? getFieldError(salvar.error, 'nome') : null;

  function handleOpenChange(proximo) {
    if (salvar.isPending) return;
    if (!proximo) {
      setNome('');
      salvar.reset();
    }
    onOpenChange(proximo);
  }

  function handleSubmit(event) {
    event.preventDefault();
    salvar.mutate({ nome: nome.trim(), filtros }, { onSuccess: () => handleOpenChange(false) });
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="rounded-none">
        <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Salvar visão atual</DialogTitle>
            <DialogDescription>A busca e os filtros atuais ficam salvos só para você.</DialogDescription>
          </DialogHeader>

          <CampoForm erro={erroNome} id={NOME_ID} label="Nome" obrigatorio>
            {(controle) => (
              <Input
                {...controle}
                autoFocus
                className="h-9 rounded-none"
                onChange={(event) => {
                  setNome(event.target.value);
                  if (salvar.error) salvar.reset();
                }}
                value={nome}
              />
            )}
          </CampoForm>

          {/* Erro sem campo (rede, 5xx) — o de nome já aparece inline. */}
          {!erroNome && <ApiErrorAlert error={salvar.error} id={ERRO_ID} title="Não foi possível salvar" />}

          <DialogFooter>
            <DialogClose render={<Button disabled={salvar.isPending} type="button" variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button aria-busy={salvar.isPending} disabled={salvar.isPending || !nome.trim()} type="submit">
              {salvar.isPending ? 'Salvando…' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
