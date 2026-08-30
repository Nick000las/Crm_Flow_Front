/**
 * @file Criar ou editar uma opção de lista.
 */
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
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { semChave } from '@/lib/objetos';
import { getFieldError } from '@/services/api';

import { CATEGORIAS_STATUS, ROTULOS_CATEGORIA } from '../../constants';
import { useAtualizarOpcao, useCriarOpcao } from '../../hooks/use-listas';
import {
  payloadDaOpcao,
  pedeProbabilidade,
  temCategoria,
  validarOpcao,
  valoresDaOpcao,
} from '../../lib/listas';
import { AJUDA_PROBABILIDADE_PADRAO } from '../../lib/probabilidade';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';

const CAMPOS_DO_SERVIDOR = ['label', 'color', 'category', 'probabilidadePadrao'];
const OPCOES_CATEGORIA = Object.values(CATEGORIAS_STATUS).map((valor) => ({
  valor,
  rotulo: ROTULOS_CATEGORIA[valor],
}));
// Valor do seletor de cor quando a opção não tem cor (ele não aceita vazio).
const COR_INICIAL_DO_SELETOR = '#6b7280';

function CampoCor({ value, onChange, controle }) {
  return (
    <div className="flex items-center gap-2">
      <Input
        aria-label="Escolher cor"
        className="size-9 shrink-0 cursor-pointer p-0.5"
        onChange={(event) => onChange(event.target.value)}
        type="color"
        value={value || COR_INICIAL_DO_SELETOR}
      />
      <Input
        {...controle}
        className="uppercase"
        maxLength={7}
        onChange={(event) => onChange(event.target.value.trim())}
        placeholder="Sem cor"
        value={value}
      />
      <Button disabled={!value} onClick={() => onChange('')} type="button" variant="ghost">
        Sem cor
      </Button>
    </div>
  );
}

/** Montado só com o dialog aberto: cada abertura parte da opção atual. */
function FormOpcao({ tipo, opcao, pipelineId, onSalvo }) {
  const editando = Boolean(opcao);
  const [valores, setValores] = useState(() => valoresDaOpcao(tipo, opcao));
  const [errosCliente, setErrosCliente] = useState({});
  const criar = useCriarOpcao(pipelineId);
  const atualizar = useAtualizarOpcao(pipelineId);
  const mutacao = editando ? atualizar : criar;
  // Só ao criar status de pipeline: na edição, a probabilidade é a coluna da tabela.
  const comProbabilidade = Boolean(pipelineId) && !editando && pedeProbabilidade(tipo, valores);

  const erroDe = (campo) =>
    errosCliente[campo] ?? (mutacao.error ? getFieldError(mutacao.error, campo) : null);
  const erroSemCampo =
    mutacao.error && !CAMPOS_DO_SERVIDOR.some((campo) => getFieldError(mutacao.error, campo));

  function alterar(campo, valor) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    setErrosCliente((atuais) => semChave(atuais, campo));

    if (mutacao.error) {
      mutacao.reset();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();

    // Fora de status de pipeline, o campo não aparece e não vai.
    const enviados = comProbabilidade ? valores : { ...valores, probabilidadePadrao: '' };
    const erros = validarOpcao(tipo, enviados);

    if (Object.keys(erros).length > 0) {
      setErrosCliente(erros);

      return;
    }

    const corpo = payloadDaOpcao(tipo, enviados, opcao);

    if (!corpo) {
      onSalvo(null);

      return;
    }

    if (editando) {
      atualizar.mutate({ tipo, id: opcao.id, parcial: corpo }, { onSuccess: onSalvo });
    } else {
      criar.mutate({ tipo, corpo }, { onSuccess: onSalvo });
    }
  }

  return (
    <Form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={erroDe('label')} id="opcao-label" label="Nome" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus

            onChange={(event) => alterar('label', event.target.value)}
            value={valores.label}
          />
        )}
      </CampoForm>

      {editando && (
        <p className="-mt-2 text-xs text-muted-foreground">
          Chave <span className="text-foreground select-all">{opcao.key}</span> — é o que fica
          gravado nos leads; não muda ao renomear.
        </p>
      )}

      <CampoForm erro={erroDe('color')} id="opcao-cor" label="Cor">
        {(controle) => (
          <CampoCor
            controle={controle}
            onChange={(cor) => alterar('color', cor)}
            value={valores.color}
          />
        )}
      </CampoForm>

      {temCategoria(tipo) && (
        <CampoForm erro={erroDe('category')} id="opcao-categoria" label="Categoria" obrigatorio>
          {(controle) => (
            <SelectSimples
              {...controle}
              onChange={(categoria) => alterar('category', categoria)}
              opcoes={OPCOES_CATEGORIA}
              value={valores.category}
            />
          )}
        </CampoForm>
      )}

      {comProbabilidade && (
        <CampoForm
          ajuda={`${AJUDA_PROBABILIDADE_PADRAO} Vazio usa a sugestão do sistema.`}
          erro={erroDe('probabilidadePadrao')}
          id="opcao-probabilidade"
          label="Probabilidade (%)"
        >
          {(controle) => (
            <Input
              {...controle}
              className="w-24 tabular-nums"
              inputMode="numeric"
              onChange={(event) => alterar('probabilidadePadrao', event.target.value)}
              value={valores.probabilidadePadrao}
            />
          )}
        </CampoForm>
      )}

      {erroSemCampo && (
        <ApiErrorAlert error={mutacao.error} id="opcao-erro" title="Não foi possível salvar" />
      )}

      <DialogFooter>
        <DialogClose
          render={<Button disabled={mutacao.isPending} type="button" variant="outline" />}
        >
          Cancelar
        </DialogClose>
        <Button
          aria-busy={mutacao.isPending}
          disabled={mutacao.isPending}
          type="submit"
          loading={mutacao.isPending}
          loadingText="Salvando…"
        >
          {editando ? 'Salvar alterações' : 'Criar opção'}
        </Button>
      </DialogFooter>
    </Form>
  );
}

/**
 * Criar ou editar uma opção de lista.
 *
 * @param {{
 *   tipo: string,
 *   rotuloDaLista: string,
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   opcao?: import('../../lib/listas').OpcaoConfigurada | null,
 *   onSalvo: (salva: import('../../lib/listas').OpcaoConfigurada | null) => void,
 *   pipelineId?: string,
 * }} props `onSalvo(null)` = nada mudou
 */
export function OpcaoDialog({
  tipo,
  rotuloDaLista,
  open,
  onOpenChange,
  opcao,
  onSalvo,
  pipelineId,
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{opcao ? 'Editar opção' : 'Nova opção'}</DialogTitle>
          <DialogDescription>
            {rotuloDaLista} — aparece nos seletores do lead e nos filtros.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FormOpcao
            key={opcao?.id ?? 'nova'}
            onSalvo={(salva) => {
              onOpenChange(false);
              onSalvo(salva);
            }}
            opcao={opcao}
            pipelineId={pipelineId}
            tipo={tipo}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
