import { CAMPO_VALOR } from './form-lead.js';

/**
 * Colunas do export: um checklist ordenável. Começa com as colunas visíveis
 * da tabela (na ordem dela) marcadas, e o resto desmarcado no fim.
 *
 * `funilEstagio` também é aceito pelo back, mas fica de fora enquanto o
 * front não mostra estágio (aguarda o Kanban).
 *
 * @typedef {{ chave: string, label: string, marcada: boolean }} ItemExport
 */

/**
 * @param {{ chave: string, label: string }[]} campos de `/crm/leads/fields`
 * @param {string[]} idsVisiveis colunas visíveis na tabela, em ordem
 * @returns {ItemExport[]}
 */
export function itensIniciais(campos, idsVisiveis) {
  const exportaveis = [...campos, CAMPO_VALOR].map(({ chave, label }) => ({ chave, label }));
  const porChave = new Map(exportaveis.map((item) => [item.chave, item]));

  // Colunas da tabela que não exportam (ex.: Responsável) somem aqui.
  const visiveis = idsVisiveis.filter((id) => porChave.has(id));
  const restantes = exportaveis.filter((item) => !visiveis.includes(item.chave));

  return [
    ...visiveis.map((id) => ({ ...porChave.get(id), marcada: true })),
    ...restantes.map((item) => ({ ...item, marcada: false })),
  ];
}

/**
 * @param {ItemExport[]} itens
 * @param {number} indice
 * @param {-1 | 1} direcao
 */
export function moverItem(itens, indice, direcao) {
  const destino = indice + direcao;
  if (destino < 0 || destino >= itens.length) return itens;

  const proximos = [...itens];
  [proximos[indice], proximos[destino]] = [proximos[destino], proximos[indice]];
  return proximos;
}

/** @param {ItemExport[]} itens @param {string} chave */
export function alternarItem(itens, chave) {
  return itens.map((item) => (item.chave === chave ? { ...item, marcada: !item.marcada } : item));
}

/** Corpo `colunas` do export, na ordem escolhida. @param {ItemExport[]} itens */
export function colunasSelecionadas(itens) {
  return itens.filter((item) => item.marcada).map((item) => item.chave);
}
