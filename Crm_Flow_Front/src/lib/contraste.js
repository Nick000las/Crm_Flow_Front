/**
 * Contraste WCAG 2.x entre cores `#RRGGBB`. Genérico de propósito: serve ao
 * marcador de cor das listas do CRM hoje e ao accent por tenant (tema
 * Camaleão) depois.
 */

const HEX = /^#([0-9a-f]{6})$/i;
const CANAL_MAXIMO = 255;
/** Contraste mínimo de elemento gráfico (WCAG 1.4.11). */
export const CONTRASTE_MINIMO_GRAFICO = 3;
const FUNDO_PADRAO = '#ffffff';

/** @param {string} hex */
export function corValida(hex) {
  return typeof hex === 'string' && HEX.test(hex);
}

/** Canal sRGB (0–255) → valor linear. */
function linear(canal) {
  const c = canal / CANAL_MAXIMO;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/**
 * Luminância relativa (0 = preto, 1 = branco).
 *
 * @param {string} hex `#RRGGBB`
 */
export function luminancia(hex) {
  const [, corpo] = HEX.exec(hex) ?? [];
  if (!corpo) {
    throw new TypeError(`Cor inválida: ${hex}`);
  }

  const [r, g, b] = [0, 2, 4].map((inicio) =>
    linear(Number.parseInt(corpo.slice(inicio, inicio + 2), 16)),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Razão de contraste entre duas cores (1 a 21), na ordem que for.
 *
 * @param {string} a
 * @param {string} b
 */
export function razaoDeContraste(a, b) {
  const [clara, escura] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (clara + 0.05) / (escura + 0.05);
}

/**
 * Marcador de cor que some no fundo (amarelo-claro no branco) ganha contorno.
 *
 * @param {string} hex
 * @param {string} [fundo]
 */
export function marcadorPrecisaContorno(hex, fundo = FUNDO_PADRAO) {
  return corValida(hex) && razaoDeContraste(hex, fundo) < CONTRASTE_MINIMO_GRAFICO;
}
