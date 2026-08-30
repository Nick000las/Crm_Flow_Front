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
import { useExcluirDefinicao } from '../hooks/use-campos-config';

/**
 * Excluir um campo personalizado. O dado já preenchido continua nos leads
 * (órfão) — o back confirma isso no `aviso`, que vai para quem chamou.
 *
 * @param {{
 *   definicao: { id: string, label: string } | null,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluido: (aviso: string) => void,
 * }} props aberto enquanto houver `definicao`
 */
export function ExcluirDefinicaoDialog({ definicao, onOpenChange, onExcluido }) {
  const excluir = useExcluirDefinicao();

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
    excluir.mutate(definicao.id, {
      onSuccess: (resposta) => {
        onOpenChange(false);
        onExcluido(resposta?.aviso ?? `Campo "${definicao.label}" excluído.`);
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={Boolean(definicao)}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir campo</AlertDialogTitle>
          <AlertDialogDescription>
            {definicao ? `"${definicao.label}" sai do formulário, dos filtros e da tabela. ` : ''}
            Os valores já preenchidos continuam guardados nos leads.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert
          error={excluir.error}
          id="excluir-definicao-erro"
          title="Não foi possível excluir"
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending || !definicao}
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
