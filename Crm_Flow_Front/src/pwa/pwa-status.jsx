/**
 * @file Implementa a integração de pwa status, na área de aplicação, mantendo seus recursos e
 * contratos compartilhados.
 */
import { useState } from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { ModalPresence } from '@/components/motion/modal-presence';
import { Button } from '@/components/ui/button';

import { pwaStore } from './pwa-store';
import { usePwa } from './use-pwa';

export function PwaStatus() {
  const { online, updateAvailable } = usePwa();
  const [confirmUpdate, setConfirmUpdate] = useState(false);

  return (
    <>
      {!online && (
        <div
          role="status"
          className="flex shrink-0 items-start justify-center gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2 text-xs text-foreground"
        >
          <WifiOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>Você está offline. Conecte-se para carregar dados e salvar alterações.</p>
        </div>
      )}
      {online && updateAvailable && (
        <div
          role="status"
          className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b border-info/25 bg-info/10 px-4 py-2 text-xs text-foreground"
        >
          <RefreshCw aria-hidden="true" className="size-4 text-info" />
          <p>Uma nova versão do Flow CRM está disponível.</p>
          <Button size="sm" variant="outline" onClick={() => setConfirmUpdate(true)}>
            Atualizar aplicativo
          </Button>
        </div>
      )}
      <ModalPresence>
        {confirmUpdate && (
          <ConfirmationDialog
            title="Atualizar o aplicativo?"
            description="A página será recarregada. Salve suas alterações antes de continuar; rascunhos não salvos nesta aba serão perdidos."
            confirmLabel="Atualizar agora"
            pendingLabel="Atualizando…"
            onConfirm={() => pwaStore.activateUpdate()}
            onClose={() => setConfirmUpdate(false)}
          />
        )}
      </ModalPresence>
    </>
  );
}
