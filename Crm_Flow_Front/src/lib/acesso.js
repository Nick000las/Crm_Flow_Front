/**
 * Regra única de visibilidade da navegação: Rail, Sidebar e `RequireRole`
 * decidem por aqui, nunca com condição de papel/módulo no JSX.
 *
 * É só UX — o back valida de verdade (403 `FORBIDDEN` / `MODULE_NOT_ENABLED`).
 * Por isso, se a sessão vier sem `modulosAtivos` (resposta inesperada de
 * `/auth/me`), o filtro por módulo fica permissivo em vez de esconder tudo.
 *
 * @param {{ moduleKey?: string, roles?: readonly string[] }} entry
 * @param {{ role?: string, modulosAtivos?: string[] } | null | undefined} user
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

  if (entry.roles && !entry.roles.includes(user.role)) return false;

  return true;
}
