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
 * Colunas que a tabela mostra mas não vêm de `/fields`, aceitas no export só
 * com `crm.massa`. `idNaTabela` casa com o id da coluna da tabela, para o
 * padrão continuar sendo "o que se está vendo".
 */
const COLUNAS_EXTRAS = Object.freeze([
  Object.freeze({ chave: 'usuarioResponsavelId', label: 'Responsável', idNaTabela: 'responsavel' }),
  Object.freeze({ chave: 'createdAt', label: 'Criado em', idNaTabela: 'criadoEm' }),
]);

/**
 * @param {{ chave: string, label: string }[]} campos de `/crm/leads/fields`
 * @param {string[]} idsVisiveis colunas visíveis na tabela, em ordem
 * @param {{ comMassa?: boolean }} [opcoes] `crm.massa` libera Responsável e Criado em
 * @returns {ItemExport[]}
 */
export function itensIniciais(campos, idsVisiveis, { comMassa = false } = {}) {
  const extras = comMassa ? COLUNAS_EXTRAS : [];
  const exportaveis = [...campos, CAMPO_VALOR, ...extras].map(({ chave, label }) => ({
    chave,
    label,
  }));
  const porChave = new Map(exportaveis.map((item) => [item.chave, item]));
  const chaveDaColuna = new Map(extras.map((extra) => [extra.idNaTabela, extra.chave]));

  // Colunas da tabela que não exportam (ex.: Responsável sem a flag) somem aqui.
  const visiveis = idsVisiveis
    .map((id) => chaveDaColuna.get(id) ?? id)
    .filter((chave) => porChave.has(chave));
  const restantes = exportaveis.filter((item) => !visiveis.includes(item.chave));

  return [
    ...visiveis.map((chave) => ({ ...porChave.get(chave), marcada: true })),
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
  if (destino < 0 || destino >= itens.length) {
    return itens;
  }

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
