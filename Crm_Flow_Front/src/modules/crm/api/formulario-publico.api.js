import { apiRequest } from '@/services/api';

/**
 * API pública do formulário (FM3/FM4): sem `Authorization` e sem cookie
 * (`credentials: 'omit'`). O token vem da URL e não vai para nenhum outro
 * lugar. Tipos em `lib/formulario-publico.js`.
 *
 * @typedef {{
 *   formulario: { nome: string },
 *   pessoa: { primeiroNome: string | null },
 *   expiraEm: string,
 *   versao: import('../lib/formulario-publico.js').VersaoPublica,
 * }} FormularioPublico
 */

const SEM_COOKIE = Object.freeze({ credentials: 'omit' });
const doToken = (token) => `/public/f/${encodeURIComponent(token)}`;

/**
 * Não muda nada: pode ser chamado de novo ao recarregar. 404 = link
 * indisponível (vencido, cancelado, respondido ou inexistente, sem distinção).
 *
 * @param {string} token
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<FormularioPublico>}
 */
export function obterFormularioPublico(token, options) {
  return apiRequest(doToken(token), { ...SEM_COOKIE, ...options });
}

/**
 * Marca que a pessoa abriu. Uma vez, depois que o formulário aparece: um robô
 * que só lê o link não conta.
 *
 * @param {string} token
 */
export function marcarFormularioAberto(token) {
  return apiRequest(`${doToken(token)}/aberto`, { ...SEM_COOKIE, method: 'POST' });
}

/**
 * 201 `{ enviado: true }`; 400 com `fields` (o link continua valendo); 404 se
 * o link acabou (inclusive no segundo de um clique duplo).
 *
 * @param {string} token
 * @param {ReturnType<typeof import('../lib/formulario-publico.js').corpoDoEnvio>} corpo
 * @returns {Promise<{ enviado: true }>}
 */
export function enviarRespostaPublica(token, corpo) {
  return apiRequest(`${doToken(token)}/respostas`, { ...SEM_COOKIE, method: 'POST', json: corpo });
}
