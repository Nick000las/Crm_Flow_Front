const FILENAME_STAR = /filename\*\s*=\s*([^']*)'[^']*'([^;]+)/i;
const FILENAME_PLAIN = /filename\s*=\s*(?:"([^"]*)"|([^;]+))/i;

/**
 * Extrai o nome do arquivo de um cabeçalho `Content-Disposition`.
 * `filename*` (RFC 5987) tem prioridade por suportar acentos.
 *
 * @param {string | null | undefined} header
 * @returns {string | null}
 */
export function parseFilename(header) {
  if (!header) {
    return null;
  }

  const star = FILENAME_STAR.exec(header);

  if (star) {
    try {
      return decodeURIComponent(star[2].trim());
    } catch {
      // cai para o `filename` simples
    }
  }

  const plain = FILENAME_PLAIN.exec(header);
  const name = (plain?.[1] ?? plain?.[2] ?? '').trim();

  return name || null;
}
