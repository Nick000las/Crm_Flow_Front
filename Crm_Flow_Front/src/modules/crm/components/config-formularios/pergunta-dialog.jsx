/**
 * @file Criar ou editar uma pergunta do formulário. Vai para o rascunho; quem grava é o
 * "Salvar" do editor. A resposta fica só no formulário: não vira campo do CRM.
 */
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Textarea } from '@/components/ui/textarea';
import { focusFirstInvalidField } from '@/lib/form-validation';

import {
  LIMITES_PERGUNTA,
  OPCOES_TIPO_PERGUNTA,
  perguntaVazia,
  TIPOS_COM_OPCOES,
  validarPergunta,
} from '../../lib/formularios';
import { CampoForm } from '../campo-form';
import { OpcoesEditor } from '../opcoes-editor';
import { SelectSimples } from '../select-simples';

/** Montado só com o dialog aberto: cada abertura parte da pergunta atual. */
function FormPergunta({ pergunta, onConfirmar }) {
  const [valores, setValores] = useState(() => pergunta ?? perguntaVazia());
  const [erros, setErros] = useState({});
  const comOpcoes = TIPOS_COM_OPCOES.includes(valores.tipo);

  function mudar(campo, valor) {
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
    setErros({});
  }

  function handleSubmit(event) {
    event.preventDefault();

    const encontrados = validarPergunta(valores);

    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);

      focusFirstInvalidField(
        event.currentTarget,
        Object.keys(encontrados).map((campo) => `pergunta-${campo}`),
      );

      return;
    }

    onConfirmar(valores);
  }

  return (
    <Form className="grid gap-4" noValidate onSubmit={handleSubmit}>
      <CampoForm erro={erros.rotulo} id="pergunta-rotulo" label="Pergunta" obrigatorio>
        {(controle) => (
          <Input
            {...controle}
            autoFocus

            maxLength={LIMITES_PERGUNTA.ROTULO}
            onChange={(event) => mudar('rotulo', event.target.value)}
            placeholder="Ex.: Sente dor ao mastigar?"
            value={valores.rotulo}
          />
        )}
      </CampoForm>
      <CampoForm
        ajuda="Aparece sob a pergunta, para orientar quem responde."
        erro={erros.ajuda}
        id="pergunta-ajuda"
        label="Texto de apoio"
      >
        {(controle) => (
          <Textarea
            {...controle}

            maxLength={LIMITES_PERGUNTA.AJUDA}
            onChange={(event) => mudar('ajuda', event.target.value)}
            rows={2}
            value={valores.ajuda}
          />
        )}
      </CampoForm>
      <CampoForm id="pergunta-tipo" label="Tipo de resposta" obrigatorio>
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(tipo) => tipo && mudar('tipo', tipo)}
            opcoes={OPCOES_TIPO_PERGUNTA}
            value={valores.tipo}
          />
        )}
      </CampoForm>
      {comOpcoes && (
        <OpcoesEditor
          erro={erros.opcoes}
          erroId="pergunta-opcoes-erro"
          onChange={(opcoes) => mudar('opcoes', opcoes)}
          opcoes={valores.opcoes}
        />
      )}
      <label className="flex items-start gap-2 text-sm" htmlFor="pergunta-sensivel">
        <Checkbox
          checked={valores.sensivel}
          id="pergunta-sensivel"
          onCheckedChange={(marcado) => mudar('sensivel', Boolean(marcado))}
        />
        <span>
          Resposta sensível
          <span className="block text-xs text-muted-foreground">
            Só aparece para quem pode ver campos sensíveis.
          </span>
        </span>
      </label>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>Cancelar</DialogClose>
        <Button type="submit">{pergunta ? 'Aplicar' : 'Adicionar pergunta'}</Button>
      </DialogFooter>
    </Form>
  );
}

/**
 * Criar ou editar uma pergunta do formulário. Vai para o rascunho; quem grava
 * é o "Salvar" do editor. A resposta fica só no formulário: não vira campo do
 * CRM.
 *
 * @param {{
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   pergunta: import('../../lib/formularios').PerguntaNoForm | null,
 *   onConfirmar: (pergunta: import('../../lib/formularios').PerguntaNoForm) => void,
 * }} props `pergunta: null` = nova
 */
export function PerguntaDialog({ open, onOpenChange, pergunta, onConfirmar }) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{pergunta ? 'Editar pergunta' : 'Nova pergunta'}</DialogTitle>
          <DialogDescription>
            A resposta fica só no formulário: não vira campo, coluna nem filtro do CRM.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <FormPergunta
            onConfirmar={(confirmada) => {
              onOpenChange(false);
              onConfirmar(confirmada);
            }}
            pergunta={pergunta}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
