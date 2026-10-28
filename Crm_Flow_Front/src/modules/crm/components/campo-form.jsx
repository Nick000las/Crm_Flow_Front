import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Rótulo, controle e erro de um campo. O controle recebe `id`, `aria-invalid`
 * e `aria-describedby` prontos — o erro é sempre anunciado junto do campo.
 *
 * `motivoTravado` (campo só de ver pela permissão, M13; calculado pela
 * pontuação, M14): o controle vem com `disabled` e o motivo num tooltip (o
 * mesmo texto em `sr-only`, na descrição). Os eventos do controle desligam
 * para o hover chegar ao gatilho.
 *
 * @param {{
 *   id: string,
 *   label: string,
 *   obrigatorio?: boolean,
 *   erro?: string | null,
 *   ajuda?: string | null,
 *   comoGrupo?: boolean,
 *   motivoTravado?: string | null,
 *   children: (controle: {
 *     id: string,
 *     'aria-invalid': boolean | undefined,
 *     'aria-describedby': string | undefined,
 *     disabled?: boolean,
 *   }) => import('react').ReactNode,
 * }} props
 */
export function CampoForm({
  id,
  label,
  obrigatorio = false,
  erro,
  ajuda = null,
  comoGrupo = false,
  motivoTravado = null,
  children,
}) {
  const erroId = `${id}-erro`;
  const ajudaId = `${id}-ajuda`;
  const travadoId = `${id}-travado`;
  const descricao = [motivoTravado && travadoId, ajuda && ajudaId, erro && erroId].filter(Boolean).join(' ') || undefined;
  const rotulo = (
    <>
      {label}
      {obrigatorio && (
        <>
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
          <span className="sr-only">(obrigatório)</span>
        </>
      )}
    </>
  );
  const controleLivre = children({
    id,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': descricao,
    ...(motivoTravado && { disabled: true }),
  });
  const controle = motivoTravado ? (
    <>
      <Tooltip>
        <TooltipTrigger render={<div className="cursor-not-allowed [&_*]:pointer-events-none" />}>
          {controleLivre}
        </TooltipTrigger>
        <TooltipContent>{motivoTravado}</TooltipContent>
      </Tooltip>
      <span className="sr-only" id={travadoId}>
        {motivoTravado}
      </span>
    </>
  ) : (
    controleLivre
  );
  const mensagemErro = (
    <>
      {ajuda && (
        <p className="text-xs text-muted-foreground" id={ajudaId}>
          {ajuda}
        </p>
      )}
      {erro && (
        <p className="text-xs text-destructive" id={erroId}>
          {erro}
        </p>
      )}
    </>
  );

  if (comoGrupo) {
    // Grupo de checkboxes: o rótulo nomeia o grupo, não um input.
    return (
      <fieldset className="grid gap-1.5" aria-describedby={descricao}>
        <legend className="mb-1.5 text-sm font-medium">{rotulo}</legend>
        {controle}
        {mensagemErro}
      </fieldset>
    );
  }

  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      {controle}
      {mensagemErro}
    </div>
  );
}
