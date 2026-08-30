import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAbortError, toApiError } from '@/services/api-error';

export function ApiErrorAlert({ error, className, id, title = 'Não foi possível continuar' }) {
  if (!error || isAbortError(error)) {
    return null;
  }

  const apiError = toApiError(error);
  const fieldMessages = Object.values(apiError.fields).flat();

  return (
    <div
      className={cn(
        'flex gap-3 rounded-xl border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-destructive dark:border-destructive/35 dark:bg-destructive/12',
        className,
      )}
      id={id}
      role="alert"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid gap-0.5 text-sm">
        <p className="leading-snug font-medium">{title}</p>
        <p className="leading-relaxed opacity-90">{apiError.message}</p>
        {fieldMessages.length > 0 && <p className="sr-only">{fieldMessages.join('. ')}</p>}
        {apiError.requestId && (
          <p className="mt-1 font-mono text-xs opacity-75">Referência: {apiError.requestId}</p>
        )}
      </div>
    </div>
  );
}
