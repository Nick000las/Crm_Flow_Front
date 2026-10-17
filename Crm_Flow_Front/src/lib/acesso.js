/**
 * Regra única de visibilidade da navegação: Rail, Sidebar e `RequireRole`
 * decidem por aqui, nunca com condição de papel/módulo/flag no JSX.
 *
 * É só UX — o back valida de verdade (403 `FORBIDDEN` /
 * `MODULE_NOT_ENABLED` / `FEATURE_NOT_ENABLED`).
 *
 * - Módulo: se a sessão vier sem `modulosAtivos` (resposta inesperada de
 *   `/auth/me`), o filtro fica permissivo em vez de esconder tudo.
 * - Feature flag: o contrário — sem `featuresAtivas`, a feature conta como
 *   desligada. Flag protege funcionalidade nova em rollout; o fallback
 *   seguro é a interface de antes.
 *
 * - `feature`: uma flag ou uma lista (todas precisam estar ligadas).
 *
 * @param {{
 *   moduleKey?: string,
 *   roles?: readonly string[],
 *   feature?: string | readonly string[],
 * }} entry
 * @param {{ role?: string, modulosAtivos?: string[], featuresAtivas?: string[] } | null | undefined} user
 */
export function podeVer(entry, user) {
  if (!user) return false;

  if (
    entry.moduleKey &&
    Array.isArray(user.modulosAtivos) &&
    !user.modulosAtivos.includes(entry.moduleKey)
  ) {
    return false;
  }

  if (entry.feature && !temTodas(user, [entry.feature].flat())) return false;

  if (entry.roles && !entry.roles.includes(user.role)) return false;

  return true;
}

/**
 * Feature flag ligada para o tenant da sessão (`/auth/me` → `featuresAtivas`).
 * Para trocar comportamento dentro de uma tela; para esconder item de menu ou
 * rota, use `feature` na entrada de `podeVer`.
 *
 * @param {{ featuresAtivas?: string[] } | null | undefined} user
 * @param {string} featureKey  ex.: `crm.listas`
 */
export function temFeature(user, featureKey) {
  return Array.isArray(user?.featuresAtivas) && user.featuresAtivas.includes(featureKey);
}

/** @param {Parameters<typeof temFeature>[0]} user @param {readonly string[]} flags */
function temTodas(user, flags) {
  return flags.every((flag) => temFeature(user, flag));
}

/**
 * Página de navegação com subseções próprias (CRM › Configurações): só
 * aparece se o usuário enxerga ao menos uma subseção pronta — senão o
 * OPERADOR veria um item que leva a lugar nenhum.
 *
 * @param {Parameters<typeof podeVer>[0] & { secoes?: readonly (Parameters<typeof podeVer>[0] & { pronta?: boolean })[] }} page
 * @param {Parameters<typeof podeVer>[1]} user
 */
export function paginaVisivel(page, user) {
  if (!podeVer(page, user)) return false;
  if (!page.secoes) return true;

  return page.secoes.some((secao) => secao.pronta !== false && podeVer(secao, user));
}
