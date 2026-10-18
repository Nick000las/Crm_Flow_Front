/**
 * Export síncrono: o back gera o arquivo no request (até `EXPORTACAO.MAX_LINHAS`).
 * Com `crm.massa`: `formato: 'csv'` e as colunas `usuarioResponsavelId`/`createdAt`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ colunas: string[], filtro?: object, formato?: 'xlsx' | 'csv' }} pedido `colunas` na ordem desejada
 * @returns {Promise<{ blob: Blob, filename: string | null }>}
 */
export function exportarLeads(authApi, pedido) {
  return authApi.download('/crm/export', pedido);
}
