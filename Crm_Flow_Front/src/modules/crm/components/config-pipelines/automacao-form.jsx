/**
 * @file Atendimento automático: venda ganha no pipeline de origem cria um card aqui. Quem só lê
 * vê uma frase, sem controles.
 */
import { useState } from 'react';

import { ApiErrorAlert } from '@/components/api-error-alert';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { getFieldError } from '@/services/api';

import { REGRAS_DONO_ATENDIMENTO, ROTULOS_REGRA_DONO } from '../../constants';
import { useAtualizarPipeline } from '../../hooks/use-pipelines';
import { useUsuarios } from '../../hooks/use-usuarios';
import {
  origensDaAutomacao,
  payloadDaAutomacao,
  resumoDaAutomacao,
  statusAbertos,
  valoresDaAutomacao,
} from '../../lib/pipelines';
import { CampoForm } from '../campo-form';
import { SelectSimples } from '../select-simples';

const OPCOES_REGRA = Object.values(REGRAS_DONO_ATENDIMENTO).map((valor) => ({
  valor,
  rotulo: ROTULOS_REGRA_DONO[valor],
}));
const CAMPOS_DO_SERVIDOR = ['automacao.origemId', 'automacao.statusInicial', 'automacao.donoId'];

/**
 * Atendimento automático: venda ganha no pipeline de origem cria um card aqui.
 * Quem só lê vê uma frase, sem controles.
 *
 * @param {{
 *   pipeline: import('../../api/pipelines.api').Pipeline,
 *   pipelines: import('../../api/pipelines.api').Pipeline[],
 *   podeEditar: boolean,
 *   onAviso: (texto: string | null) => void,
 * }} props
 */
export function AutomacaoForm({ pipeline, pipelines, podeEditar, onAviso }) {
  const { usuarios, nomePorId } = useUsuarios();
  const salvar = useAtualizarPipeline();
  const [valores, setValores] = useState(() => valoresDaAutomacao(pipeline.automacao));

  if (!podeEditar) {
    return (
      <p className="text-sm text-muted-foreground">
        {resumoDaAutomacao(pipeline, pipelines, nomePorId)}
      </p>
    );
  }

  const idBase = `automacao-${pipeline.id}`;
  const erroDe = (campo) => (salvar.error ? getFieldError(salvar.error, campo) : null);
  const erroSemCampo = salvar.error && !CAMPOS_DO_SERVIDOR.some(erroDe);
  const opcoesDono = usuarios.map((usuario) => ({ valor: usuario.id, rotulo: usuario.nome }));

  function alterar(campo, valor) {
    onAviso(null);
    salvar.reset();
    setValores((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    salvar.mutate(
      { id: pipeline.id, parcial: { automacao: payloadDaAutomacao(valores) } },
      { onSuccess: () => onAviso('Automação salva.') },
    );
  }

  return (
    <Form className="grid max-w-md gap-4" noValidate onSubmit={handleSubmit}>
      <label className="flex items-center gap-2 text-sm" htmlFor={`${idBase}-ativa`}>
        <Switch
          checked={valores.ativa}
          id={`${idBase}-ativa`}
          onCheckedChange={(ativa) => alterar('ativa', ativa)}
        />
        Criar card aqui quando uma venda for ganha
      </label>

      <CampoForm
        erro={erroDe('automacao.origemId')}
        id={`${idBase}-origem`}
        label="Pipeline de origem"
      >
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(valor) => alterar('origemId', valor)}
            opcoes={origensDaAutomacao(pipelines)}
            value={valores.origemId}
          />
        )}
      </CampoForm>

      <CampoForm
        erro={erroDe('automacao.statusInicial')}
        id={`${idBase}-status`}
        label="Status inicial"
      >
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(valor) => alterar('statusInicial', valor)}
            opcoes={statusAbertos(pipeline)}
            value={valores.statusInicial}
          />
        )}
      </CampoForm>

      <CampoForm id={`${idBase}-regra`} label="Responsável pelo card">
        {(controle) => (
          <SelectSimples
            {...controle}
            onChange={(valor) => alterar('regraDoDono', valor)}
            opcoes={OPCOES_REGRA}
            value={valores.regraDoDono}
          />
        )}
      </CampoForm>

      {valores.regraDoDono === REGRAS_DONO_ATENDIMENTO.USUARIO && (
        <CampoForm erro={erroDe('automacao.donoId')} id={`${idBase}-dono`} label="Usuário">
          {(controle) => (
            <SelectSimples
              {...controle}
              onChange={(valor) => alterar('donoId', valor)}
              opcoes={opcoesDono}
              value={valores.donoId}
            />
          )}
        </CampoForm>
      )}

      {erroSemCampo && (
        <ApiErrorAlert
          error={salvar.error}
          id={`${idBase}-erro`}
          title="Não foi possível salvar a automação"
        />
      )}

      <div>
        <Button
          aria-busy={salvar.isPending}
          disabled={salvar.isPending}
          type="submit"
          loading={salvar.isPending}
          loadingText="Salvando…"
        >
          {'Salvar automação'}
        </Button>
      </div>
    </Form>
  );
}
