import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

/** Carregamento limitado à área que consulta dados; nunca cobre a aplicação. */
export function LoadingState({ label = 'Carregando…', inline = false, className }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={cn(
        'flex items-center gap-2 text-sm text-muted-foreground',
        !inline && 'min-h-24 justify-center rounded-lg border border-border p-6',
        className,
      )}
    >
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
