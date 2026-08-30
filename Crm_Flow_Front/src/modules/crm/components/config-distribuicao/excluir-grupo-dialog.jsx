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
import { useExcluirGrupo } from '../../hooks/use-distribuicao';

/**
 * Excluir um grupo. Destino de alguma regra salva = 409, com o nome da
 * regra na mensagem do back (aparece aqui).
 *
 * @param {{
 *   grupo: { id: string, nome: string } | null,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluido: (nome: string) => void,
 * }} props aberto enquanto houver `grupo`
 */
export function ExcluirGrupoDialog({ grupo, onOpenChange, onExcluido }) {
  const excluir = useExcluirGrupo();

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
    excluir.mutate(grupo.id, {
      onSuccess: () => {
        onOpenChange(false);
        onExcluido(grupo.nome);
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={Boolean(grupo)}>
      <AlertDialogContent className="rounded-none">
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir grupo</AlertDialogTitle>
          <AlertDialogDescription>
            {grupo ? `"${grupo.nome}" sai de vez. ` : ''}
            Os leads já atribuídos continuam com quem estão.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ApiErrorAlert
          error={excluir.error}
          id="excluir-grupo-erro"
          title="Não foi possível excluir"
        />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={excluir.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            aria-busy={excluir.isPending}
            disabled={excluir.isPending || !grupo}
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
