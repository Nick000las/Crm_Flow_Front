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
import { useExcluirOpcao } from '../../hooks/use-listas';

/**
 * Excluir uma opção sem uso. Em uso ou última da lista, o back responde 409
 * — a mensagem dele aparece aqui (o botão da linha já evita o caso comum).
 *
 * @param {{
 *   tipo: string,
 *   opcao: { id: string, label: string } | null,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluida: (label: string) => void,
 * }} props aberto enquanto houver `opcao`
 */
export function ExcluirOpcaoDialog({ tipo, opcao, onOpenChange, onExcluida }) {
  const excluir = useExcluirOpcao();

  function handleOpenChange(proximo) {
    if (excluir.isPending) return;
    if (!proximo) excluir.reset();
    onOpenChange(proximo);
  }

  function confirmar() {
    excluir.mutate(
      { tipo, id: opcao.id },
      {
        onSuccess: () => {
          onOpenChange(false);
          onExcluida(opcao.label);
        },
      },
    );
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={Boolean(opcao)}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir opção</AlertDialogTitle>
          <AlertDialogDescription>
            {opcao ? `"${opcao.label}" sai da lista de vez. ` : ''}
            Para só tirar dos seletores e manter o histórico, desative em vez de excluir.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert error={excluir.error} id="excluir-opcao-erro" title="Não foi possível excluir" />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending || !opcao}
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
