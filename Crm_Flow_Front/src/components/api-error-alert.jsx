import { CircleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAbortError, toApiError } from '@/services/api-error';

export function ApiErrorAlert({
  error,
  className,
  id,
  title = 'Não foi possível continuar',
}) {
  if (!error || isAbortError(error)) return null;

  const apiError = toApiError(error);
  const fieldMessages = Object.values(apiError.fields).flat();

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive',
        className,
      )}
      id={id}
      role="alert"
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="grid gap-0.5 text-sm">
        <p className="font-medium">{title}</p>
        <p>{apiError.message}</p>
        {fieldMessages.length > 0 && (
          <p className="sr-only">{fieldMessages.join('. ')}</p>
        )}
        {apiError.requestId && (
          <p className="mt-1 text-xs opacity-80">
            Referência: {apiError.requestId}
          </p>
        )}
      </div>
    </div>
  );
}
