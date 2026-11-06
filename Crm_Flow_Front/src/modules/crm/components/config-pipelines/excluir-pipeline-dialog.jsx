import { ApiErrorAlert } from '@/components/api-error-alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useExcluirPipeline } from '../../hooks/use-pipelines';

/**
 * Excluir um pipeline sem dependências. O botão já evita o caso comum; o 409
 * do back (oportunidade na lixeira, por exemplo) aparece aqui.
 *
 * @param {{
 *   pipeline: { id: string, nome: string },
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluido: (nome: string) => void,
 * }} props
 */
export function ExcluirPipelineDialog({ pipeline, open, onOpenChange, onExcluido }) {
  const excluir = useExcluirPipeline();

  function handleOpenChange(proximo) {
    if (excluir.isPending) {
      return;
    }
    if (!proximo) {
      excluir.reset();
    }
    onOpenChange(proximo);
  }

  function confirmar() {
    excluir.mutate(pipeline.id, {
      onSuccess: () => {
        onOpenChange(false);
        onExcluido(pipeline.nome);
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir pipeline</AlertDialogTitle>
          <AlertDialogDescription>
            &quot;{pipeline.nome}&quot; e os status dele saem de vez.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert
          error={excluir.error}
          id="excluir-pipeline-erro"
          title="Não foi possível excluir"
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending}
            onClick={confirmar}
            variant="destructive"
          >
            {excluir.isPending ? 'Excluindo…' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
