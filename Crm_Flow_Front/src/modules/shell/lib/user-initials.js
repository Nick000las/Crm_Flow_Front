/**
 * @file Gera iniciais do usuário para o avatar da navegação.
 */
export function getInitials(name, email) {
  const source = String(name || email || 'U').trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}
