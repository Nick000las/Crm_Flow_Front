/**
 * Export síncrono: o back gera o .xlsx no request (até `EXPORTACAO.MAX_LINHAS`).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ colunas: string[], filtro?: object }} pedido `colunas` na ordem desejada
 * @returns {Promise<{ blob: Blob, filename: string | null }>}
 */
export function exportarLeads(authApi, pedido) {
  return authApi.download('/crm/export', pedido);
}
