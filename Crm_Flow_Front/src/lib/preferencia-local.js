/**
 * Preferência de quem está vendo, em `localStorage`. Pode voltar vazia: nada
 * que precise persistir de verdade mora aqui.
 *
 * @param {string} chave
 * @returns {unknown} `null` sem nada salvo ou com o storage bloqueado
 */
export function lerPreferencia(chave) {
  try {
    return JSON.parse(localStorage.getItem(chave) ?? 'null');
  } catch {
    return null;
  }
}

/**
 * @param {string} chave
 * @param {unknown} valor
 */
export function salvarPreferencia(chave, valor) {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    // Storage bloqueado (aba privada, cota): a escolha vale só nesta sessão.
  }
}
