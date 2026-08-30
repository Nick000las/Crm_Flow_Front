/**
 * Import de planilha em 4 etapas no back: preview (não grava) → validate
 * (grava job `pendente` com as linhas válidas) → confirm (enfileira) →
 * status (polling). Só DONO/MASTER.
 */

function formComArquivo(arquivo, campos = {}) {
  const form = new FormData();
  for (const [nome, valor] of Object.entries(campos)) {
    form.append(nome, valor);
  }
  // Arquivo por último: o back lê o multipart em qualquer ordem, mas assim os
  // campos de texto chegam antes do corpo grande.
  form.append('arquivo', arquivo);
  return form;
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {File} arquivo
 * @returns {Promise<{ colunas: string[], totalLinhas: number, linhas: Record<string, unknown>[], campos: object[] }>}
 */
export function previsualizarImportacao(authApi, arquivo) {
  return authApi.upload('/crm/import/preview', formComArquivo(arquivo));
}

/**
 * O arquivo vai de novo: o back não guarda a planilha entre as etapas.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ arquivo: File, mapeamento: Record<string, string>, estrategiaDuplicata: string, baseLegalLote?: string }} dados
 *   `baseLegalLote` (LGPD): base das linhas sem base; com a base obrigatória e sem coluna mapeada,
 *   o back dá 400 em `mapeamento` sem ela
 * @returns {Promise<{ jobId: string | null, totalLinhas: number, linhasValidas: number, erros: { linha: number, coluna?: string, motivo: string }[] }>}
 */
export function validarImportacao(
  authApi,
  { arquivo, mapeamento, estrategiaDuplicata, baseLegalLote },
) {
  return authApi.upload(
    '/crm/import/validate',
    formComArquivo(arquivo, {
      mapeamento: JSON.stringify(mapeamento),
      estrategiaDuplicata,
      // LGPD: só vai escolhido (o back exige a flag para aceitá-lo).
      ...(baseLegalLote && { baseLegalLote }),
    }),
  );
}

/**
 * 503 `QUEUE_UNAVAILABLE` devolve o job para `pendente` — dá para confirmar de novo.
 * `acoes` decide linha a linha o que fazer com as duplicadas (`crm.duplicidade`);
 * linha sem ação segue a estratégia geral.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} jobId
 * @param {Record<string, 'pular' | 'atualizar' | 'criar'> | null} [acoes]
 */
export function confirmarImportacao(authApi, jobId, acoes) {
  return authApi.post(`/crm/import/${encodeURIComponent(jobId)}/confirm`, acoes ? { acoes } : {});
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} jobId
 * @returns {Promise<import('../types.js').ImportJob>}
 */
export function buscarImportacao(authApi, jobId, options) {
  return authApi.get(`/crm/import/${encodeURIComponent(jobId)}`, options);
}
