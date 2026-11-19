import { ConfirmationDialog } from '@/components/confirmation-dialog';

/**
 * Confirmação de arquivar, só com `crm.formularios` (FM6): arquivar cancela os
 * links de formulário ainda não respondidos, e desarquivar não os traz de
 * volta. Sem a flag, arquivar continua sem confirmação (tudo se desfaz).
 * Montado só com um lead a confirmar; `onConfirmar` lança o erro, que o dialog mostra.
 *
 * @param {{
 *   lead: { nome?: string | null },
 *   onConfirmar: () => Promise<unknown>,
 *   onFechar: () => void,
 * }} props
 */
export function ConfirmarArquivarDialog({ lead, onConfirmar, onFechar }) {
  const quem = lead.nome ? `"${lead.nome}"` : 'O lead';

  return (
    <ConfirmationDialog
      confirmLabel="Arquivar"
      description={`${quem} sai da lista. Os links de formulário ainda não respondidos serão cancelados; ao desarquivar, gere um novo.`}
      onClose={onFechar}
      onConfirm={onConfirmar}
      pendingLabel="Arquivando…"
      title="Arquivar o lead?"
    />
  );
}
