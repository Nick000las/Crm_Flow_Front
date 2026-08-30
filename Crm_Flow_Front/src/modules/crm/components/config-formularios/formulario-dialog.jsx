import { focusFirstInvalidField } from '@/lib/form-validation';
import { Form } from '@/components/ui/form';
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
import { Textarea } from '@/components/ui/textarea';
import { getFieldError } from '@/services/api';
import { useCriarFormulario } from '../../hooks/use-formularios';
import { MENSAGENS_FORMULARIO, VALIDADE, validarNoCliente } from '../../lib/formularios';
import { CampoForm } from '../campo-form';

const CAMPOS_DO_SERVIDOR = ['nome', 'descricao', 'validadeDias'];
const SEM_RASCUNHO = { secoes: [], introducao: '', termo: '', sequencia: 0 };

/** Montado só com o dialog aberto: cada abertura começa vazia. */
function FormNovo({ onCriado }) {
  const [dados, setDados] = useState({
    nome: '',
    descricao: '',
    validadeDias: String(VALIDADE.PADRAO),
    ativo: true,
  });
  const [errosLocais, setErrosLocais] = useState({});
  const criar = useCriarFormulario();

  const erroDe = (campo) =>
    errosLocais[campo] ?? (criar.error ? getFieldError(criar.error, campo) : null);
  const erroSemCampo = criar.error && !CAMPOS_DO_SERVIDOR.some((campo) => erroDe(campo));

  function mudar(campo, valor) {
    setDados((atuais) => ({ ...atuais, [campo]: valor }));
    setErrosLocais({});
    if (criar.error) {
      criar.reset();
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const { dados: erros } = validarNoCliente(dados, SEM_RASCUNHO, []);
    if (Object.keys(erros).length > 0) {
      setErrosLocais(erros);
      focusFirstInvalidField(
        event.currentTarget,
        Object.keys(erros).map(
          (campo) => `formulario-novo-${campo === 'validadeDias' ? 'validade' : campo}`,
        ),
      );
      return;
    }
    criar.mutate(
      {
        nome: dados.nome.trim(),
        descricao: dados.descricao.trim() || null,
        validadeDias: Number(dados.validadeDias),
      },
      { onSuccess: onCriado },
    );
  }

  return (
    <Form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      {/* 409 de nome repetido e o limite de formulários chegam em `fields.nome`. */}
      <CampoForm erro={erroDe('nome')} id="formulario-novo-nome" label="Nome" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus
            className="h-9"
            onChange={(event) => mudar('nome', event.target.value)}
            placeholder={`Ex.: Anamnese`}
            value={dados.nome}
          />
        )}
      </CampoForm>
      <CampoForm erro={erroDe('descricao')} id="formulario-novo-descricao" label="Descrição">
        {(controle) => (
          <Textarea
            {...controle}
            onChange={(event) => mudar('descricao', event.target.value)}
            rows={2}
            value={dados.descricao}
          />
        )}
      </CampoForm>
      <CampoForm
        ajuda={`Por quantos dias o link vale, de ${VALIDADE.MINIMO} a ${VALIDADE.MAXIMO}.`}
        erro={erroDe('validadeDias')}
        id="formulario-novo-validade"
        label="Validade do link (dias)"
        obrigatorio
      >
        {(controle) => (
          <Input
            {...controle}
            className="h-9 w-32 tabular-nums"
            inputMode="numeric"
            max={VALIDADE.MAXIMO}
            min={VALIDADE.MINIMO}
            onChange={(event) => mudar('validadeDias', event.target.value)}
            type="number"
            value={dados.validadeDias}
          />
        )}
      </CampoForm>

      {erroSemCampo && (
        <ApiErrorAlert
          error={criar.error}
          id="formulario-novo-erro"
          title="Não foi possível criar o formulário"
        />
      )}

      <DialogFooter>
        <DialogClose render={<Button disabled={criar.isPending} type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          aria-busy={criar.isPending}
          disabled={criar.isPending}
          type="submit"
          loading={criar.isPending}
          loadingText="Criando…"
        >
          {'Criar e montar'}
        </Button>
      </DialogFooter>
    </Form>
  );
}

/**
 * Criar um formulário. Os campos e o termo entram depois, no editor.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onCriado: (detalhe: import('../../lib/formularios').DetalheDoFormulario) => void,
 * }} props
 */
export function FormularioDialog({ open, onOpenChange, onCriado }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo formulário</DialogTitle>
          <DialogDescription>
            {MENSAGENS_FORMULARIO.LIMITE} Os campos entram no passo seguinte.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FormNovo
            onCriado={(detalhe) => {
              onOpenChange(false);
              onCriado(detalhe);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
