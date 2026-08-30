/**
 * @file Cards de projeto ligados a uma pessoa (flag `kanban_universal.vinculo_entidade`). A
 * rota é do Kanban; o CRM só a chama, sem importar o módulo. Vêm só os cards de quadros que o
 * usuário vê, até 100.
 */
/**
 * Cards de projeto ligados a uma pessoa (flag `kanban_universal.vinculo_entidade`).
 * A rota é do Kanban; o CRM só a chama, sem importar o módulo. Vêm só os
 * cards de quadros que o usuário vê, até 100.
 *
 * @typedef {{
 *   cardId: string,
 *   titulo: string,
 *   boardId: string,
 *   boardNome: string,
 *   colunaNome: string,
 *   updatedAt: string,
 * }} ProjetoDoLead
 */

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ProjetoDoLead[]>}
 */
export function listarProjetosDoLead(authApi, leadId, options) {
  const query = new URLSearchParams({ entidadeTipo: 'pessoa', entidadeId: leadId });

  return authApi.get(`/kanban/vinculos?${query}`, options);
}
