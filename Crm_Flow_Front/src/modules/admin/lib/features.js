/**
 * Agrupa o catálogo de flags por módulo, na ordem em que os módulos
 * aparecem no catálogo, para a seção de flags do tenant listar por bloco.
 *
 * @param {{ moduleKey: string, featureKey: string }[]} catalogo
 * @returns {{ moduleKey: string, features: string[] }[]}
 */
export function agruparFeaturesPorModulo(catalogo) {
  /** @type {Map<string, string[]>} */
  const grupos = new Map();

  for (const { moduleKey, featureKey } of catalogo) {
    if (!grupos.has(moduleKey)) grupos.set(moduleKey, []);
    grupos.get(moduleKey).push(featureKey);
  }

  return [...grupos].map(([moduleKey, features]) => ({ moduleKey, features }));
}

/**
 * Mesmo conjunto, em qualquer ordem — decide se "Salvar flags" tem o que
 * salvar.
 *
 * @param {string[]} a
 * @param {string[]} b
 */
export function mesmoConjunto(a, b) {
  return a.length === b.length && a.every((item) => b.includes(item));
}
