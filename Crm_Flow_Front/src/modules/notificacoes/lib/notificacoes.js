import { destinoCrm } from '../../crm/lib/notificacoes.js';

/**
 * Notificações in-app (sino do shell). São do core: qualquer módulo gera, e
 * cada um diz para onde a sua leva (`DESTINO_POR_MODULO`).
 *
 * @typedef {{
 *   id: string,
 *   modulo: string,
 *   tipo: string,
 *   titulo: string,
 *   corpo: string | null,
 *   dados: Record<string, unknown> | null,
 *   lida_em: string | null,
 *   created_at: string,
 * }} Notificacao
 * @typedef {{ itens: Notificacao[], total: number, naoLidas: number, pagina: number, tamanho: number }} PaginaNotificacoes
 */

/** Itens por página no sino. */
export const TAMANHO_NOTIFICACOES = 10;

/** Acima disso o contador vira "9+": o número exato está na lista. */
const MAX_CONTADOR = 9;

/** Recarga periódica do contador — não há push. */
export const INTERVALO_NOTIFICACOES_MS = 60_000;

/** @type {Readonly<Record<string, (dados: Notificacao['dados']) => string | null>>} */
const DESTINO_POR_MODULO = Object.freeze({ crm: destinoCrm });

/**
 * Caminho interno para onde a notificação leva, ou `null` (só marca como
 * lida). Módulo sem regra própria usa `dados.rota` quando é caminho interno —
 * nunca uma URL externa.
 *
 * @param {Pick<Notificacao, 'modulo' | 'dados'>} notificacao
 */
export function destinoDaNotificacao({ modulo, dados }) {
  const doModulo = DESTINO_POR_MODULO[modulo]?.(dados);
  if (doModulo) return doModulo;

  const rota = dados?.rota;
  return typeof rota === 'string' && rota.startsWith('/') && !rota.startsWith('//') ? rota : null;
}

/** "3", "9+" ou vazio (sem não lidas, o contador some). */
export function textoDoContador(naoLidas) {
  if (!Number.isInteger(naoLidas) || naoLidas <= 0) return '';

  return naoLidas > MAX_CONTADOR ? `${MAX_CONTADOR}+` : String(naoLidas);
}

/** Nome acessível do botão do sino. */
export function rotuloDoSino(naoLidas) {
  if (!Number.isInteger(naoLidas) || naoLidas <= 0) return 'Notificações';

  return `Notificações, ${naoLidas} ${naoLidas === 1 ? 'não lida' : 'não lidas'}`;
}

/** @param {number} total @param {number} tamanho */
export function totalDePaginasNotificacoes(total, tamanho = TAMANHO_NOTIFICACOES) {
  return Math.max(1, Math.ceil((Number(total) || 0) / tamanho));
}
