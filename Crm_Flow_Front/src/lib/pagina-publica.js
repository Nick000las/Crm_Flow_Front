/** Caminho da página pública do formulário (FM3), atendida fora da sessão. */
export const PREFIXO_FORMULARIO_PUBLICO = '/f/';

/** @param {string} pathname */
export const ehPaginaPublica = (pathname) => pathname.startsWith(PREFIXO_FORMULARIO_PUBLICO);

/**
 * Metas da página pública: o token está na URL, então nada de `Referer` para
 * fora e nada de indexação. Entram antes do primeiro pedido.
 */
export function prepararCabecalhoPublico() {
  for (const [name, content] of [
    ['referrer', 'no-referrer'],
    ['robots', 'noindex'],
  ]) {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.append(meta);
  }
}
