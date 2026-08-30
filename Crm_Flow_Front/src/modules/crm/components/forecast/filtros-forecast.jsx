/**
 * @file Filtros do topo do forecast. O pai valida o período (`erros`) e entrega as listas
 * prontas em `{ valor, rotulo }`.
 */
import { useId } from 'react';

import { FieldError } from '@/components/field-error';
import { Input } from '@/components/ui/input';

import { SelectSimples } from '../select-simples';

const ROTULO = 'text-[11px] uppercase tracking-wide text-muted-foreground';

function Campo({ rotulo, erro, children, id }) {
  return (
    <div className="grid min-w-36 flex-1 gap-1.5 sm:max-w-56">
      <label className={ROTULO} htmlFor={id}>
        {rotulo}
      </label>
      {children}
      <FieldError id={`${id}-erro`} message={erro} />
    </div>
  );
}

/**
 * Filtros do topo do forecast. O pai valida o período (`erros`) e entrega as
 * listas prontas em `{ valor, rotulo }`.
 *
 * @param {{
 *   de: string,
 *   ate: string,
 *   erros?: { de?: string, ate?: string },
 *   onPeriodo: (periodo: { de: string, ate: string }) => void,
 *   pipelines: { valor: string, rotulo: string }[],
 *   pipelineId: string,
 *   onPipeline: (id: string) => void,
 *   usuarios: { valor: string, rotulo: string }[],
 *   responsavelId: string,
 *   onResponsavel: (id: string) => void,
 *   opcoesAgrupar: { valor: string, rotulo: string }[],
 *   agrupar: string,
 *   onAgrupar: (valor: string) => void,
 * }} props
 */
export function FiltrosForecast({
  de,
  ate,
  erros = {},
  onPeriodo,
  pipelines,
  pipelineId,
  onPipeline,
  usuarios,
  responsavelId,
  onResponsavel,
  opcoesAgrupar,
  agrupar,
  onAgrupar,
}) {
  const base = useId();
  const ids = {
    de: `${base}-de`,
    ate: `${base}-ate`,
    pipeline: `${base}-pipeline`,
    responsavel: `${base}-responsavel`,
    agrupar: `${base}-agrupar`,
  };

  return (
    <div className="flex flex-wrap items-start gap-3">
      <Campo erro={erros.de} id={ids.de} rotulo="De">
        <Input
          aria-describedby={erros.de ? `${ids.de}-erro` : undefined}
          aria-invalid={Boolean(erros.de)}

          id={ids.de}
          onChange={(event) => onPeriodo({ de: event.target.value, ate })}
          type="month"
          value={de}
        />
      </Campo>
      <Campo erro={erros.ate} id={ids.ate} rotulo="Até">
        <Input
          aria-describedby={erros.ate ? `${ids.ate}-erro` : undefined}
          aria-invalid={Boolean(erros.ate)}

          id={ids.ate}
          onChange={(event) => onPeriodo({ de, ate: event.target.value })}
          type="month"
          value={ate}
        />
      </Campo>
      <Campo id={ids.pipeline} rotulo="Pipeline">
        <SelectSimples
          id={ids.pipeline}
          onChange={onPipeline}
          opcoes={pipelines}
          value={pipelineId}
          vazio="Todos os pipelines"
        />
      </Campo>
      <Campo id={ids.responsavel} rotulo="Responsável">
        <SelectSimples
          id={ids.responsavel}
          onChange={onResponsavel}
          opcoes={usuarios}
          value={responsavelId}
          vazio="Todos"
        />
      </Campo>
      <Campo id={ids.agrupar} rotulo="Agrupar">
        <SelectSimples
          id={ids.agrupar}
          onChange={onAgrupar}
          opcoes={opcoesAgrupar}
          value={agrupar}
        />
      </Campo>
    </div>
  );
}
