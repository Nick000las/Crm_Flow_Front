import { ACESSOS_CAMPO } from '../constants.js';

/**
 * Permissão por campo (`crm.permissoes`), tela de gestão: por papel
 * configurável (hoje só OPERADOR), cada campo é Editar, Só ver ou Oculto.
 * O PUT leva o mapa inteiro do papel. Puro.
 *
 * @typedef {import('../api/permissoes.api.js').ConfigPermissoes} ConfigPermissoes
 * @typedef {Record<string, Record<string, string>>} ValoresPermissoes  papel → campoId → acesso
 */

/** As duas formas de contato: uma delas fica editável (o back dá 400). */
const CHAVES_CONTATO = Object.freeze(['email', 'telefone']);

export const MENSAGENS_PERMISSOES = Object.freeze({
  CONTATO: 'Deixe e-mail ou telefone editável: sem um dos dois, não dá para criar lead.',
});

/** @param {ConfigPermissoes} config @returns {ValoresPermissoes} */
export function valoresDasPermissoes(config) {
  return Object.fromEntries(
    config.papeis.map((papel) => [
      papel,
      Object.fromEntries(config.campos.map((campo) => [campo.id, campo.acessos[papel] ?? ACESSOS_CAMPO.EDITAR])),
    ]),
  );
}

/**
 * Corpo do PUT: o mapa inteiro de cada papel, com as chaves em ordem (para
 * comparar com o salvo sem falso "mudou").
 *
 * @param {ValoresPermissoes} valores
 */
export function permissoesParaEnvio(valores) {
  return Object.fromEntries(
    Object.entries(valores).map(([papel, acessos]) => [
      papel,
      Object.fromEntries(Object.entries(acessos).sort(([a], [b]) => a.localeCompare(b))),
    ]),
  );
}

/** @param {ValoresPermissoes} valores @param {ConfigPermissoes} config */
export function permissoesMudaram(valores, config) {
  return (
    JSON.stringify(permissoesParaEnvio(valores)) !== JSON.stringify(permissoesParaEnvio(valoresDasPermissoes(config)))
  );
}

/**
 * Erros locais por papel (o mesmo do 400 do back): e-mail e telefone não
 * podem ficar os dois restritos.
 *
 * @param {ValoresPermissoes} valores
 * @param {ConfigPermissoes} config
 * @returns {Record<string, string>} papel → mensagem
 */
export function validarPermissoes(valores, config) {
  const erros = {};
  const contatos = config.campos.filter((campo) => CHAVES_CONTATO.includes(campo.chave));
  if (contatos.length < CHAVES_CONTATO.length) return erros;

  for (const [papel, acessos] of Object.entries(valores)) {
    if (contatos.every((campo) => acessos[campo.id] !== ACESSOS_CAMPO.EDITAR)) erros[papel] = MENSAGENS_PERMISSOES.CONTATO;
  }
  return erros;
}

/**
 * 400 do PUT → `porCampo` (`<papel>.<campoId>`, na linha) e `porPapel`
 * (`<papel>`, no alerta). O resto volta em `outros`.
 *
 * @param {Record<string, string[]> | null | undefined} fields
 * @param {string[]} papeis
 * @returns {{ porCampo: Record<string, Record<string, string>>, porPapel: Record<string, string>, outros: string[] }}
 */
export function errosDasPermissoes(fields, papeis) {
  const porCampo = {};
  const porPapel = {};
  const outros = [];

  for (const [caminho, mensagens] of Object.entries(fields ?? {})) {
    const mensagem = Array.isArray(mensagens) ? mensagens[0] : String(mensagens);
    const [papel, campoId, ...resto] = caminho.split('.');
    if (!papeis.includes(papel) || resto.length > 0) outros.push(mensagem);
    else if (campoId) porCampo[campoId] = { ...porCampo[campoId], [papel]: mensagem };
    else porPapel[papel] = mensagem;
  }

  return { porCampo, porPapel, outros };
}
