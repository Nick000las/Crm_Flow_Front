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
import { semChave } from '@/lib/objetos';
import { getFieldError } from '@/services/api';
import { ROTULOS_TIPO } from '../constants';
import { useCriarDefinicao, useEditarDefinicao } from '../hooks/use-campos-config';
import { payloadDaDefinicao, usaOpcoes, validarDefinicao, valoresDaDefinicao } from '../lib/campos-config';
import { CampoForm } from './campo-form';
import { OpcoesEditor } from './opcoes-editor';
import { SelectSimples } from './select-simples';

const OPCOES_TIPO = Object.entries(ROTULOS_TIPO).map(([valor, rotulo]) => ({ valor, rotulo }));
const CAMPOS_DO_SERVIDOR = ['label', 'tipo', 'opcoes'];

/**
 * Formulário da definição. Montado só com o dialog aberto, então cada
 * abertura começa limpa a partir de `definicao`.
 */
function FormDefinicao({ definicao, proximaOrdem, onSalvo }) {
  const editando = Boolean(definicao);
  const [valores, setValores] = useState(() => valoresDaDefinicao(definicao));
  const [errosCliente, setErrosCliente] = useState({});
  const criar = useCriarDefinicao();
  const editar = useEditarDefinicao();
  const mutacao = editando ? editar : criar;

  const erroDe = (campo) =>
    errosCliente[campo] ?? (mutacao.error ? getFieldError(mutacao.error, campo) : null);
  const erroSemCampo =
    mutacao.error && !CAMPOS_DO_SERVIDOR.some((campo) => getFieldError(mutacao.error, campo));

  function alterar(campo, valor) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    setErrosCliente((atuais) => semChave(atuais, campo));
    if (mutacao.error) mutacao.reset();
  }

  function handleSubmit(event) {
    event.preventDefault();
    const erros = validarDefinicao(valores);
    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);
      return;
    }

    const payload = payloadDaDefinicao(valores);
    const opcoesMutacao = { onSuccess: onSalvo };
    if (editando) editar.mutate({ id: definicao.id, definicao: payload }, opcoesMutacao);
    else criar.mutate({ ...payload, ordem: proximaOrdem }, opcoesMutacao);
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={erroDe('label')} id="definicao-label" label="Nome do campo" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className="h-9 rounded-none"
            onChange={(event) => alterar('label', event.target.value)}
            value={valores.label}
          />
        )}
      </CampoForm>

      {editando && (
        <p className="text-xs text-muted-foreground">
          Chave <span className="font-mono text-foreground select-all">{definicao.chave}</span> — gerada na
          criação, não muda ao renomear.
        </p>
      )}

      <CampoForm erro={erroDe('tipo')} id="definicao-tipo" label="Tipo" obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(tipo) => alterar('tipo', tipo)}
            opcoes={OPCOES_TIPO}
            value={valores.tipo}
          />
        )}
      </CampoForm>
      {editando && valores.tipo !== definicao.tipo && (
        <p className="-mt-2 text-xs text-muted-foreground" role="status">
          Mudar o tipo não converte os valores já salvos nos leads.
        </p>
      )}

      {usaOpcoes(valores.tipo) && (
        <OpcoesEditor
          erro={erroDe('opcoes')}
          erroId="definicao-opcoes-erro"
          onChange={(opcoes) => alterar('opcoes', opcoes)}
          opcoes={valores.opcoes}
        />
      )}

      {erroSemCampo && <ApiErrorAlert error={mutacao.error} id="definicao-erro" title="Não foi possível salvar" />}

      <DialogFooter>
        <DialogClose render={<Button disabled={mutacao.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button aria-busy={mutacao.isPending} disabled={mutacao.isPending} type="submit">
          {mutacao.isPending ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar campo'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Criar ou editar um campo personalizado (Camada 3).
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   definicao?: import('../lib/campos-config').Definicao | null,
 *   proximaOrdem: number,
 *   onSalvo: () => void,
 * }} props Obrigatoriedade e telas ficam na matriz de Configurações › Campos.
 */
export function DefinicaoDialog({ open, onOpenChange, definicao, proximaOrdem, onSalvo }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{definicao ? 'Editar campo' : 'Novo campo personalizado'}</DialogTitle>
          <DialogDescription>Aparece no formulário do lead, nos filtros e nas colunas da tabela.</DialogDescription>
        </DialogHeader>
        {open && (
          <FormDefinicao
            definicao={definicao}
            key={definicao?.id ?? 'novo'}
            onSalvo={() => {
              onOpenChange(false);
              onSalvo();
            }}
            proximaOrdem={proximaOrdem}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
