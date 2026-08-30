/**
 * @file Renderiza api error alert, na área de aplicação, expondo os estados e eventos
 * necessários à interface.
 */
import { CircleAlert } from 'lucide-react';

import { Alert } from '@/components/ui/alert';
import { isAbortError, toApiError } from '@/services/api-error';

export function ApiErrorAlert({ error, className, id, title = 'Não foi possível continuar' }) {
  if (!error || isAbortError(error)) {
    return null;
  }

  const apiError = toApiError(error);
  const fieldMessages = Object.values(apiError.fields).flat();

  return (
    <Alert variant="destructive" icon={CircleAlert} className={className} id={id}>
      <div className="grid gap-0.5 text-sm">
        <p className="leading-snug font-medium">{title}</p>
        <p className="leading-relaxed opacity-90">{apiError.message}</p>
        {fieldMessages.length > 0 && <p className="sr-only">{fieldMessages.join('. ')}</p>}
        {apiError.requestId && (
          <p className="mt-1 font-mono text-xs opacity-75">Referência: {apiError.requestId}</p>
        )}
      </div>
    </Alert>
  );
}
