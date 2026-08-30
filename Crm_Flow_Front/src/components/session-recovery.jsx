import { ApiErrorAlert } from './api-error-alert';
import { Button } from './ui/button';

export function SessionRecovery({ error, onRetry }) {
  return (
    <main className="grid min-h-svh place-items-center bg-muted/40 px-4">
      <section className="grid w-full max-w-md gap-4" aria-label="Restaurar sessão">
        <ApiErrorAlert error={error} title="Não foi possível verificar sua sessão" />
        <Button onClick={onRetry}>Tentar novamente</Button>
      </section>
    </main>
  );
}
