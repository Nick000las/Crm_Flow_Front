import { descreverItem, itemDaLinha, linhaDoItem } from './filtro.js';
import { MENSAGENS_REGRA, valorDaCondicao } from './regras.js';

/**
 * Condições de regra no formato `{ campoId, operador, valor }` — as mesmas
 * da distribuição (M12) e da pontuação (M14), com o valor no formato do
 * construtor de filtro (como a regra de campo do M8). Puro.
 *
 * @typedef {{ campoId: string, operador: string, valor?: unknown }} CondicaoDaApi
 * @typedef {{ campoId: string, operador: string, valor: unknown }} CondicaoNoForm  `valor` no formato do construtor de filtro
 */

/**
 * Condição da API → linha do editor. Campo que saiu do schema fica como
 * veio (a validação acusa).
 *
 * @param {CondicaoDaApi} condicao
 * @param {import('../types.js').Campo[]} campos
 * @returns {CondicaoNoForm}
 */
export function condicaoParaForm({ campoId, operador, valor }, campos) {
  const campo = campos.find((atual) => atual.id === campoId);
  if (!campo) return { campoId, operador, valor: valor ?? null };
  return { campoId, operador, valor: linhaDoItem({ chave: campo.chave, operador, valor }, campo).valor };
}

/**
 * Linha do editor → item do PUT. Chame depois de `validarCondicoes`.
 *
 * @param {CondicaoNoForm} condicao
 * @param {import('../types.js').Campo[]} campos
 * @returns {CondicaoDaApi}
 */
export function condicaoParaEnvio(condicao, campos) {
  const { valor } = /** @type {{ valor: unknown }} */ (valorDaCondicao(condicao, campos));
  return { campoId: condicao.campoId, operador: condicao.operador, ...(valor !== undefined && { valor }) };
}

/**
 * Erros das condições de uma regra, pelo caminho do 400 do back sem o
 * `regras.<n>.`: `condicoes` (limite) e `condicoes.<i>`.
 *
 * @param {CondicaoNoForm[]} condicoes
 * @param {import('../types.js').Campo[]} campos
 * @param {number} maximo
 * @returns {Record<string, string>}
 */
export function validarCondicoes(condicoes, campos, maximo) {
  const erros = {};
  if (condicoes.length > maximo) erros.condicoes = `Use no máximo ${maximo} condições`;

  condicoes.forEach((condicao, indice) => {
    const resultado = valorDaCondicao(condicao, campos);
    if ('erro' in resultado) erros[`condicoes.${indice}`] = resultado.erro;
  });

  return erros;
}

/**
 * Frase das condições: "Origem é Site e UF é SP"; sem condição, "Todos os
 * leads". Condição incompleta aparece só pelo campo.
 *
 * @param {{ condicoes: CondicaoNoForm[] }} regra
 * @param {import('../types.js').Campo[]} campos
 * @param {Map<string, string>} [nomePorId]
 */
export function descreverCondicoes(regra, campos, nomePorId) {
  if (regra.condicoes.length === 0) return 'Todos os leads';

  return regra.condicoes
    .map(({ campoId, operador, valor }) => {
      const campo = campos.find((atual) => atual.id === campoId);
      if (!campo) return MENSAGENS_REGRA.CAMPO_CONDICAO;
      const resultado = itemDaLinha({ chave: campo.chave, operador, valor }, campo);
      return 'erro' in resultado ? `${campo.label} (incompleta)` : descreverItem(resultado.item, campo, nomePorId);
    })
    .join(' e ');
}
