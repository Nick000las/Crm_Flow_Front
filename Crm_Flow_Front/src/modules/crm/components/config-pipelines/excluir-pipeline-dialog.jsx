/**
 * @file Exclui um pipeline sem dependências; conflitos da API permanecem no modal.
 */
import { ConfirmationDialog } from '@/components/confirmation-dialog';
import { ModalPresence } from '@/components/motion/modal-presence';

import { useExcluirPipeline } from '../../hooks/use-pipelines';

/** Exclui um pipeline sem dependências; conflitos da API permanecem no modal. */
export function ExcluirPipelineDialog({ pipeline, open, onOpenChange, onExcluido }) {
  const excluir = useExcluirPipeline();

  return (
    <ModalPresence>
      {open && (
        <ConfirmationDialog
          title="Excluir pipeline?"
          description={`O pipeline “${pipeline.nome}” e seus status serão excluídos permanentemente. Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir pipeline"
          pendingLabel="Excluindo…"
          onConfirm={async () => {
            await excluir.mutateAsync(pipeline.id);
            onExcluido(pipeline.nome);
          }}
          onClose={() => {
            excluir.reset();
            onOpenChange(false);
          }}
        />
      )}
    </ModalPresence>
  );
}
