/**
 * @file Segunda linha de um resultado da busca.
 */
import { podeVer } from '../../../lib/acesso.js';

/** Vínculo de card com pessoa do CRM. */
export const FLAG_VINCULO = 'kanban_universal.vinculo_entidade';

export const TIPO_PESSOA = 'pessoa';

/**
 * Vincular pede a flag, o CRM contratado (a busca é nas rotas dele) e poder
 * editar o quadro. Ver o vínculo não pede nada: se ele veio, mostra.
 *
 * @param {Parameters<typeof podeVer>[1]} user
 * @param {boolean} canEdit
 */
export function podeVincular(user, canEdit) {
  return canEdit && podeVer({ moduleKey: 'crm', feature: FLAG_VINCULO }, user);
}

/**
 * Segunda linha de um resultado da busca.
 *
 * @param {{ email?: string | null, telefone?: string | null }} lead
 */
export function contatoDaPessoa(lead) {
  return [lead.email, lead.telefone].filter(Boolean).join(' · ');
}
