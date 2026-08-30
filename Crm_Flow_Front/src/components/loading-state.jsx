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
        'flex items-center gap-2.5 text-sm text-muted-foreground',
        !inline &&
          'min-h-28 justify-center rounded-xl border border-border bg-surface/60 px-6 py-8',
        className,
      )}
    >
      <Spinner className="size-4 text-primary" />
      <span>{label}</span>
    </div>
  );
}
