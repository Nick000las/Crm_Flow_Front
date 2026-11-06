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
import { ROTULOS_TIPO_PIPELINE, TIPOS_PIPELINE } from '../../constants';
import { useAtualizarPipeline, useCriarPipeline } from '../../hooks/use-pipelines';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';

const OPCOES_TIPO = Object.values(TIPOS_PIPELINE).map((valor) => ({
  valor,
  rotulo: ROTULOS_TIPO_PIPELINE[valor],
}));
const CAMPOS_DO_SERVIDOR = ['nome', 'tipo'];
const NOME_OBRIGATORIO = 'Informe o nome do pipeline';

/** Montado só com o dialog aberto: cada abertura parte do pipeline atual. */
function FormPipeline({ pipeline, onSalvo }) {
  const editando = Boolean(pipeline);
  const [nome, setNome] = useState(pipeline?.nome ?? '');
  const [tipo, setTipo] = useState(TIPOS_PIPELINE.VENDAS);
  const [erroNome, setErroNome] = useState(null);
  const criar = useCriarPipeline();
  const atualizar = useAtualizarPipeline();
  const mutacao = editando ? atualizar : criar;

  const erroDe = (campo) => (mutacao.error ? getFieldError(mutacao.error, campo) : null);
  const erroSemCampo = mutacao.error && !CAMPOS_DO_SERVIDOR.some(erroDe);

  function handleSubmit(event) {
    event.preventDefault();
    const limpo = nome.trim();
    if (!limpo) {
      setErroNome(NOME_OBRIGATORIO);
      return;
    }

    const aoSalvar = { onSuccess: () => onSalvo(limpo) };
    if (editando) {
      atualizar.mutate({ id: pipeline.id, parcial: { nome: limpo } }, aoSalvar);
    } else {
      criar.mutate({ nome: limpo, tipo }, aoSalvar);
    }
  }

  return (
    <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={erroNome ?? erroDe('nome')} id="pipeline-nome" label="Nome" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className="h-9 rounded-none"
            onChange={(event) => {
              setNome(event.target.value);
              setErroNome(null);
              mutacao.reset();
            }}
            value={nome}
          />
        )}
      </CampoForm>

      {!editando && (
        <CampoForm erro={erroDe('tipo')} id="pipeline-tipo" label="Tipo" obrigatorio>
          {(controle) => (
            <SelectSimples {...controle} onChange={setTipo} opcoes={OPCOES_TIPO} value={tipo} />
          )}
        </CampoForm>
      )}

      {erroSemCampo && (
        <ApiErrorAlert error={mutacao.error} id="pipeline-erro" title="Não foi possível salvar" />
      )}

      <DialogFooter>
        <DialogClose
          render={<Button disabled={mutacao.isPending} type="button" variant="outline" />}
        >
          Cancelar
        </DialogClose>
        <Button aria-busy={mutacao.isPending} disabled={mutacao.isPending} type="submit">
          {mutacao.isPending ? 'Salvando…' : editando ? 'Salvar nome' : 'Criar pipeline'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Criar um pipeline ou renomear (`pipeline` presente). O tipo não muda depois.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onSalvo: (nome: string) => void,
 *   pipeline?: import('../../api/pipelines.api').Pipeline,
 * }} props
 */
export function PipelineDialog({ open, onOpenChange, onSalvo, pipeline }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="rounded-none sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{pipeline ? 'Renomear pipeline' : 'Novo pipeline'}</DialogTitle>
          <DialogDescription>
            {pipeline
              ? 'O nome aparece nas oportunidades e nos quadros.'
              : 'Nasce com uma lista inicial de status, que você pode mudar depois.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FormPipeline
            onSalvo={(nome) => {
              onOpenChange(false);
              onSalvo(nome);
            }}
            pipeline={pipeline}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
