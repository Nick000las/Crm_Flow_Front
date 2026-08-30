/**
 * @file Radio nativo com semântica, navegação por setas e envio de formulário preservados.
 */
import { cn } from '@/lib/utils';

/** Radio nativo com semântica, navegação por setas e envio de formulário preservados. */
export function Radio({ className, ...props }) {
  return (
    <input
      {...props}
      type="radio"
      data-slot="radio"
      className={cn(
        'size-4 shrink-0 cursor-pointer accent-primary outline-none focus-visible:ring-3 focus-visible:ring-ring/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    />
  );
}
