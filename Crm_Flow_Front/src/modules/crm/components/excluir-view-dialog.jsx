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
import { useExcluirView } from '../hooks/use-views';

/**
 * @param {{
 *   view: { id: string, nome: string } | null,
 *   onOpenChange: (open: boolean) => void,
 * }} props aberto enquanto houver `view`
 */
export function ExcluirViewDialog({ view, onOpenChange }) {
  const excluir = useExcluirView();

  function handleOpenChange(proximo) {
    if (excluir.isPending) return;
    if (!proximo) excluir.reset();
    onOpenChange(proximo);
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={Boolean(view)}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir view</AlertDialogTitle>
          <AlertDialogDescription>
            {view ? `"${view.nome}" será excluída. ` : ''}Os leads não são afetados.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert error={excluir.error} id="excluir-view-erro" title="Não foi possível excluir" />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending || !view}
            onClick={() => excluir.mutate(view.id, { onSuccess: () => onOpenChange(false) })}
            variant="destructive"
          >
            {excluir.isPending ? 'Excluindo…' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
