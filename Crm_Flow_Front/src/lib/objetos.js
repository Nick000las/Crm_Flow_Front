/**
 * Cópia sem `chave`. Devolve o mesmo objeto se a chave não existe, para um
 * `setState` não renderizar à toa.
 *
 * @template {Record<string, unknown>} T
 * @param {T} objeto
 * @param {string} chave
 * @returns {T}
 */
export function semChave(objeto, chave) {
  if (!(chave in objeto)) return objeto;

  const copia = { ...objeto };
  delete copia[chave];
  return copia;
}
