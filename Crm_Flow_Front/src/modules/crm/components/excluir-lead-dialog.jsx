/**
 * @file Confirmação de exclusão. Usada pela linha da tabela e pelo Sheet.
 */
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

import { DIAS_NA_LIXEIRA } from '../constants';
import { useExcluirLead } from '../hooks/use-lead-mutations';

const ERRO_ID = 'excluir-lead-erro';
const AVISO_LINKS_CANCELADOS = 'Os links de formulário ainda não respondidos serão cancelados.';

/**
 * Confirmação de exclusão. Usada pela linha da tabela e pelo Sheet. Excluir
 * sempre manda para a lixeira; com `comLixeira` (`crm.arquivo`) há tela para
 * restaurar, e o texto diz o prazo. Com `comFormularios` (FM6), avisa que os
 * links de formulário ainda não respondidos são cancelados.
 *
 * @param {{
 *   lead: { id: string, nome: string } | null,
 *   open: boolean,
 *   onOpenChange: (open: boolean) => void,
 *   onExcluido: () => void,
 *   comLixeira?: boolean,
 *   comFormularios?: boolean,
 * }} props
 */
export function ExcluirLeadDialog({
  lead,
  open,
  onOpenChange,
  onExcluido,
  comLixeira = false,
  comFormularios = false,
}) {
  const excluir = useExcluirLead();

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
    excluir.mutate(lead.id, {
      onSuccess: () => {
        onOpenChange(false);
        onExcluido();
      },
    });
  }

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir lead</AlertDialogTitle>
          <AlertDialogDescription>
            {comLixeira
              ? `${lead ? `"${lead.nome}"` : 'O lead'} vai para a lixeira e pode ser restaurado em até ${DIAS_NA_LIXEIRA} dias.`
              : `${lead ? `"${lead.nome}" será excluído. ` : ''}Esta ação não pode ser desfeita.`}
            {comFormularios && ` ${AVISO_LINKS_CANCELADOS}`}
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
