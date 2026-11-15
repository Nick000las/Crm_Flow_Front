/**
 * Links de formulário na ficha (FM2): `crm.formularios`, qualquer papel que vê
 * a pessoa. Sem a flag, 403. Tipos em `lib/links-formulario.js`.
 *
 * @typedef {import('../lib/links-formulario.js').LinkDeFormulario} LinkDeFormulario
 * @typedef {{
 *   id: string, nome: string, descricao: string | null, validadeDias: number, versao: number,
 * }} FormularioDisponivel  ativo e com versão publicada
 * @typedef {{
 *   url: string,
 *   criado: boolean,
 *   link: Pick<LinkDeFormulario, 'id' | 'status' | 'expiraEm' | 'versao'>,
 * }} LinkObtido  `criado: false` = o link ativo que já existia
 */

const doLead = (leadId) => `/crm/leads/${encodeURIComponent(leadId)}/formularios`;

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<FormularioDisponivel[]>}
 */
export function listarFormulariosDisponiveis(authApi, options) {
  return authApi.get('/crm/formularios/disponiveis', options);
}

/**
 * Do mais novo para o mais antigo, sem token.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<LinkDeFormulario[]>}
 */
export function listarLinksDaPessoa(authApi, leadId, options) {
  return authApi.get(doLead(leadId), options);
}

/**
 * Devolve o link ativo da pessoa no formulário ou cria um ("Gerar novo" é o
 * mesmo). 404: formulário inativo ou sem versão; 409: pessoa arquivada ou
 * anonimizada; 503 `FORMS_UNAVAILABLE`: servidor sem a chave dos links.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {string} formId
 * @returns {Promise<LinkObtido>}
 */
export function obterLinkDoFormulario(authApi, leadId, formId) {
  return authApi.post(`${doLead(leadId)}/${encodeURIComponent(formId)}/link`, {});
}

/**
 * Respostas da pessoa, da mais nova para a mais antiga, sem os valores.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../lib/respostas-formulario.js').RespostaResumo[]>}
 */
export function listarRespostas(authApi, leadId, options) {
  return authApi.get(`${doLead(leadId)}/respostas`, options);
}

/**
 * Uma resposta, como foi enviada. Item que o papel não vê vem com `oculto`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {string} respostaId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<import('../lib/respostas-formulario.js').RespostaDetalhe>}
 */
export function obterResposta(authApi, leadId, respostaId, options) {
  return authApi.get(`${doLead(leadId)}/respostas/${encodeURIComponent(respostaId)}`, options);
}

/**
 * 409 quando o link não está mais ativo.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} leadId
 * @param {string} linkId
 * @returns {Promise<{ id: string }>}
 */
export function revogarLinkDoFormulario(authApi, leadId, linkId) {
  return authApi.post(`${doLead(leadId)}/links/${encodeURIComponent(linkId)}/revogar`, {});
}
