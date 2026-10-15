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
import { useExcluirLead } from '../hooks/use-lead-mutations';

const ERRO_ID = 'excluir-lead-erro';

/**
 * Confirmação de exclusão. Usada pela linha da tabela e pelo Sheet.
 *
 * @param {{
 *   lead: { id: string, nome: string } | null,
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluido: () => void,
 * }} props
 */
export function ExcluirLeadDialog({ lead, open, onOpenChange, onExcluido }) {
  const excluir = useExcluirLead();

  function handleOpenChange(proximo) {
    if (excluir.isPending) return;
    if (!proximo) excluir.reset();
    onOpenChange(proximo);
  }

  function confirmar() {
    excluir.mutate(lead.id, {
      onSuccess: () => {
        onOpenChange(false);
        onExcluido();
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lead</AlertDialogTitle>
          <AlertDialogDescription>
            {lead ? `"${lead.nome}" será excluído. ` : ''}Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert error={excluir.error} id={ERRO_ID} title="Não foi possível excluir" />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending || !lead}
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
