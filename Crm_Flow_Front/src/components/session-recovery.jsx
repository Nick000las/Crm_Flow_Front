import { RefreshCw } from 'lucide-react';
import { FadeIn } from '@/components/motion/fade-in';
import { ApiErrorAlert } from './api-error-alert';
import { Button } from './ui/button';

export function SessionRecovery({ error, onRetry }) {
  return (
    <main className="grid min-h-svh place-items-center bg-surface px-4">
      <FadeIn className="w-full max-w-md">
        <section className="surface-panel grid gap-4 p-6 shadow-sm" aria-label="Restaurar sessão">
          <div className="space-y-1">
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Conexão interrompida
            </h1>
            <p className="text-sm text-muted-foreground">
              Não foi possível validar sua sessão agora. Seus dados continuam seguros.
            </p>
          </div>
          <ApiErrorAlert error={error} title="Não foi possível verificar sua sessão" />
          <Button onClick={onRetry} className="w-full">
            <RefreshCw className="size-4" aria-hidden="true" />
            Tentar novamente
          </Button>
        </section>
      </FadeIn>
    </main>
  );
}
