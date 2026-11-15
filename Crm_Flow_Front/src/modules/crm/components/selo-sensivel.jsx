import { cn } from '@/lib/utils';

/**
 * Campo sensível (FM1): oculto para o Operador e fora da exportação padrão.
 *
 * @param {{ className?: string }} props
 */
export function SeloSensivel({ className }) {
  return (
    <span
      className={cn(
        'inline-flex border border-border px-1.5 font-mono text-[11px] text-muted-foreground uppercase',
        className,
      )}
      title="Oculto para o Operador e fora da exportação padrão"
    >
      Sensível
    </span>
  );
}
