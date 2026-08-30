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
import { useRemoverMeu } from '../../hooks/use-layout';

/**
 * "Voltar ao padrão": apaga o layout próprio de quem está logado.
 *
 * @param {{ open: boolean, onOpenChange: (open: boolean) => void, onRestaurado: () => void }} props
 */
export function VoltarPadraoDialog({ open, onOpenChange, onRestaurado }) {
  const remover = useRemoverMeu();

  function handleOpenChange(proximo) {
    if (remover.isPending) {
      return;
    }
    if (!proximo) {
      remover.reset();
    }
    onOpenChange(proximo);
  }

  function confirmar() {
    remover.mutate(undefined, {
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
          <AlertDialogTitle>Voltar ao padrão da empresa?</AlertDialogTitle>
          <AlertDialogDescription>
            Seu layout próprio é descartado, e a tabela e a ficha passam a seguir o padrão definido
            pela empresa.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert
          error={remover.error}
          id="voltar-padrao-erro"
          title="Não foi possível voltar ao padrão"
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={remover.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={remover.isPending}
            disabled={remover.isPending}
            onClick={confirmar}
          >
            {remover.isPending ? 'Restaurando…' : 'Voltar ao padrão'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
