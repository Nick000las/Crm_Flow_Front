/**
 * Campos de uma tela. `/crm/leads/fields` já traz `visibilidade` por campo;
 * filtrar aqui dá o mesmo resultado de `?contexto=` com uma chamada (e um
 * cache) só para a lista inteira.
 *
 * Campo sem `visibilidade` (back anterior ao M2) conta como visível — é o
 * comportamento de antes.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {import('../types.js').Contexto} contexto
 */
export function camposDoContexto(campos, contexto) {
  return campos.filter((campo) => campo.visibilidade?.[contexto] ?? true);
}
