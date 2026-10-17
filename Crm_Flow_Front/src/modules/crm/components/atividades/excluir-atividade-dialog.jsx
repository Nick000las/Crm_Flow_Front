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
import { useExcluirAtividade } from '../../hooks/use-atividades';

/**
 * @param {{
 *   leadId: string,
 *   atividade: import('../../api/atividades.api').Atividade | null,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluida: () => void,
 * }} props aberto enquanto houver `atividade`
 */
export function ExcluirAtividadeDialog({ leadId, atividade, onOpenChange, onExcluida }) {
  const excluir = useExcluirAtividade(leadId);

  function handleOpenChange(proximo) {
    if (excluir.isPending) return;
    if (!proximo) excluir.reset();
    onOpenChange(proximo);
  }

  function confirmar() {
    excluir.mutate(atividade.id, {
      onSuccess: () => {
        onOpenChange(false);
        onExcluida();
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={Boolean(atividade)}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Remover atividade</AlertDialogTitle>
          <AlertDialogDescription>
            {atividade ? `"${atividade.titulo}" será removida. ` : ''}Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert error={excluir.error} id="excluir-atividade-erro" title="Não foi possível remover" />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending || !atividade}
            onClick={confirmar}
            variant="destructive"
          >
            {excluir.isPending ? 'Removendo…' : 'Remover'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
