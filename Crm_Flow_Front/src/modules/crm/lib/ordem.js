/** Ordem de listas reordenáveis (Campos, Listas): funções puras, sem React. */

/**
 * Move um item de `de` para `para` (soltar do arrastar ou ↑/↓).
 *
 * @template T
 * @param {T[]} itens
 * @param {number} de
 * @param {number} para
 */
export function moverPara(itens, de, para) {
  if (de === para || para < 0 || para >= itens.length) return itens;

  const proximos = [...itens];
  const [movido] = proximos.splice(de, 1);
  proximos.splice(para, 0, movido);
  return proximos;
}

/**
 * Lista na ordem de `ids` — o estado otimista enquanto o `PUT /ordem` não volta.
 *
 * @template {{ id: string }} T
 * @param {T[]} lista
 * @param {string[]} ids
 */
export function ordenarPorIds(lista, ids) {
  const porId = new Map(lista.map((campo) => [campo.id, campo]));
  return ids.map((id) => porId.get(id)).filter(Boolean);
}
