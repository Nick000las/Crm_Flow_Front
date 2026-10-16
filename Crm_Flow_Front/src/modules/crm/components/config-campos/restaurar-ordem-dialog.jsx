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
import { useRestaurarOrdemPadrao } from '../../hooks/use-configuracoes-campos';

/**
 * "Voltar ao padrão" desfaz toda a ordem personalizada de uma vez — por isso
 * pede confirmação. Nomes, telas e obrigatoriedade não mudam.
 *
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, onRestaurado: () => void }} props
 */
export function RestaurarOrdemDialog({ open, onOpenChange, onRestaurado }) {
  const restaurar = useRestaurarOrdemPadrao();

  function handleOpenChange(proximo) {
    if (restaurar.isPending) return;
    if (!proximo) restaurar.reset();
    onOpenChange(proximo);
  }

  function confirmar() {
    restaurar.mutate(undefined, {
      onSuccess: () => {
        onOpenChange(false);
        onRestaurado();
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Voltar à ordem padrão?</AlertDialogTitle>
          <AlertDialogDescription>
            Os campos do sistema voltam à ordem original e os personalizados ficam no fim, por data de
            criação. Nomes, telas e obrigatoriedade continuam como estão.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert error={restaurar.error} id="restaurar-ordem-erro" title="Não foi possível restaurar" />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={restaurar.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction aria-busy={restaurar.isPending} disabled={restaurar.isPending} onClick={confirmar}>
            {restaurar.isPending ? 'Restaurando…' : 'Voltar ao padrão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
