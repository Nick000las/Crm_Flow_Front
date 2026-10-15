import { Label } from '@/components/ui/label';

/**
 * Rótulo, controle e erro de um campo. O controle recebe `id`, `aria-invalid`
 * e `aria-describedby` prontos — o erro é sempre anunciado junto do campo.
 *
 * @param {{
 *   id: string,
 *   label: string,
 *   obrigatorio?: boolean,
 *   erro?: string | null,
 *   comoGrupo?: boolean,
 *   children: (controle: {
 *     id: string,
 *     'aria-invalid': boolean | undefined,
 *     'aria-describedby': string | undefined,
 *   }) => import('react').ReactNode,
 * }} props
 */
export function CampoForm({ id, label, obrigatorio = false, erro, comoGrupo = false, children }) {
  const erroId = `${id}-erro`;
  const descricao = erro ? erroId : undefined;
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
  const controle = children({
    id,
    'aria-invalid': erro ? true : undefined,
    'aria-describedby': descricao,
  });
  const mensagemErro = erro && (
    <p className="text-xs text-destructive" id={erroId}>
      {erro}
    </p>
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
