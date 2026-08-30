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
import { useExcluirRegra } from '../../hooks/use-regras';

/**
 * @param {{
 *   regra: import('../../lib/regras').Regra | null,
 *   descricao: string,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluida: () => void,
 * }} props aberto enquanto houver `regra`
 */
export function ExcluirRegraDialog({ regra, descricao, onOpenChange, onExcluida }) {
  const excluir = useExcluirRegra();

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
    excluir.mutate(regra.id, {
      onSuccess: () => {
        onOpenChange(false);
        onExcluida();
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={Boolean(regra)}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir regra</AlertDialogTitle>
          <AlertDialogDescription>
            {regra ? `${regra.alvo.label}: ${descricao}. ` : ''}O formulário do lead deixa de
            aplicá-la.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert
          error={excluir.error}
          id="excluir-regra-erro"
          title="Não foi possível excluir"
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending || !regra}
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
