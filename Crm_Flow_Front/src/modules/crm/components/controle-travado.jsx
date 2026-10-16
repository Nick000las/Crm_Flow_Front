import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * Explica por que um controle está desabilitado: tooltip no mouse e o
 * mesmo texto em `sr-only` com `motivoId`, que o controle aponta em
 * `aria-describedby`. Um controle travado sem explicação parece defeito.
 *
 * O controle travado precisa de `pointer-events-none` para o hover chegar
 * ao gatilho do tooltip (elemento desabilitado não dispara eventos).
 *
 * @param {{ motivo: string | null, motivoId: string, children: import('react').ReactNode }} props
 */
export function ControleTravado({ motivo, motivoId, children }) {
  if (!motivo) return children;

  return (
    <>
      <Tooltip>
        <TooltipTrigger render={<span className="inline-flex cursor-not-allowed" />}>{children}</TooltipTrigger>
        <TooltipContent>{motivo}</TooltipContent>
      </Tooltip>
      <span className="sr-only" id={motivoId}>
        {motivo}
      </span>
    </>
  );
}
