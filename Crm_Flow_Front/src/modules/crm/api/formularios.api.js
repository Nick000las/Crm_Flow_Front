/**
 * @file Uma versão publicada, como o link vai mostrar.
 */
/**
 * Formulários (FM1): só gestão (DONO/MASTER) e atrás de `crm.formularios`;
 * sem um dos dois, 403. Tipos em `lib/formularios.js`.
 *
 * @typedef {import('../lib/formularios.js').ResumoDoFormulario} ResumoDoFormulario
 * @typedef {import('../lib/formularios.js').DetalheDoFormulario} DetalheDoFormulario
 * @typedef {import('../lib/formularios.js').CampoElegivel} CampoElegivel
 * @typedef {{
 *   id: string, versao: number, publicadaEm: string, publicadaPor: string | null,
 *   introducao: string | null, termo: string,
 *   secoes: {
 *     titulo: string | null,
 *     itens: (
 *       | (import('../lib/formularios.js').ItemDeCampoDaApi & {
 *           campo: Omit<CampoElegivel, 'id' | 'politicaPadrao' | 'podePreencher'>,
 *         })
 *       | import('../lib/formularios.js').ItemDePerguntaDaApi
 *     )[],
 *   }[],
 * }} VersaoDoFormulario  `campo`: o retrato do campo no dia da publicação; a pergunta vem
 *   como foi salva
 */

const BASE = '/crm/configuracoes/formularios';
const doFormulario = (id) => `${BASE}/${encodeURIComponent(id)}`;

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<ResumoDoFormulario[]>}
 */
export function listarFormularios(authApi, options) {
  return authApi.get(BASE, options);
}

/**
 * Os campos ligados da pessoa que um formulário pode pedir.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<CampoElegivel[]>}
 */
export function listarCamposElegiveis(authApi, options) {
  return authApi.get(`${BASE}/campos-elegiveis`, options);
}

/**
 * 409 de nome repetido e 400 do limite de formulários em `fields.nome`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {{ nome: string, descricao?: string | null, validadeDias?: number }} dados
 * @returns {Promise<DetalheDoFormulario>}
 */
export function criarFormulario(authApi, dados) {
  return authApi.post(BASE, dados);
}

/**
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<DetalheDoFormulario>}
 */
export function obterFormulario(authApi, id, options) {
  return authApi.get(doFormulario(id), options);
}

/**
 * O rascunho é validado contra os campos elegíveis de agora: item de campo
 * desligado dá 400 em `rascunho.secoes.<s>.itens.<i>.campoId`.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {{
 *   nome?: string, descricao?: string | null, validadeDias?: number, ativo?: boolean,
 *   rascunho?: import('../lib/formularios.js').RascunhoDaApi,
 * }} mudancas
 * @returns {Promise<DetalheDoFormulario>}
 */
export function editarFormulario(authApi, id, mudancas) {
  return authApi.put(doFormulario(id), mudancas);
}

/**
 * Publica o rascunho salvo como versão nova. Exige ao menos um campo
 * (`rascunho.secoes`) e o termo (`rascunho.termo`).
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @returns {Promise<VersaoDoFormulario>}
 */
export function publicarFormulario(authApi, id) {
  return authApi.post(`${doFormulario(id)}/publicar`);
}

/**
 * Uma versão publicada, como o link vai mostrar.
 *
 * @param {import('@/hooks/create-auth-session').AuthApi} authApi
 * @param {string} id
 * @param {string} versaoId
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<VersaoDoFormulario>}
 */
export function obterVersao(authApi, id, versaoId, options) {
  return authApi.get(`${doFormulario(id)}/versoes/${encodeURIComponent(versaoId)}`, options);
}
