import { CHAVE_DATA_CONVERSAO, CICLOS_DE_VIDA, FUSO_PADRAO } from '../constants.js';
import { ROTULOS_CICLO, textoClienteDesde } from './ciclo-textos.js';

/**
 * Ciclo de vida do lead (FC4): regras puras de exibição e do filtro.
 *
 * `cliente_desde` e `ultima_compra` são instantes ISO UTC; a tela mostra o dia
 * (ou o mês) no fuso do tenant. O front ainda não recebe esse fuso, então quem
 * chama passa o que tiver, e o padrão é `FUSO_PADRAO`.
 */

/** Filtros de data do ciclo: texto `AAAA-MM-DD`, só com `dataConversao` em `/fields`. */
export const CHAVES_DATA_CICLO = Object.freeze([
  'clienteDesdeDe',
  'clienteDesdeAte',
  'ultimaCompraDe',
  'ultimaCompraAte',
]);

/** Todas as chaves fixas do filtro que o FC4 acrescentou ao `FiltroAplicado`. */
export const CHAVES_FIXAS_CICLO = Object.freeze([
  'cicloDeVida',
  ...CHAVES_DATA_CICLO,
  'oportunidadesAbertasMin',
  'oportunidadesAbertasMax',
]);

/** @type {Map<string, Map<string, Intl.DateTimeFormat>>} */
const formatadores = new Map();

/**
 * Formatador `pt-BR` por fuso, guardado. Fuso inválido cai no `FUSO_PADRAO`.
 *
 * @param {'mesAno' | 'dia'} formato
 * @param {string} fuso
 */
function formatador(formato, fuso) {
  let porFuso = formatadores.get(formato);
  if (!porFuso) {
    porFuso = new Map();
    formatadores.set(formato, porFuso);
  }
  if (!porFuso.has(fuso)) {
    const opcoes =
      formato === 'mesAno'
        ? { month: '2-digit', year: 'numeric' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' };
    let instancia;
    try {
      instancia = new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: fuso });
    } catch {
      instancia = new Intl.DateTimeFormat('pt-BR', { ...opcoes, timeZone: FUSO_PADRAO });
    }
    porFuso.set(fuso, instancia);
  }

  return porFuso.get(fuso);
}

/** @param {unknown} iso @returns {Date | null} */
function instante(iso) {
  if (typeof iso !== 'string' || !iso) {
    return null;
  }
  const data = new Date(iso);

  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Partes da data no fuso, montadas à mão: não depende da pontuação do `Intl`.
 *
 * @param {'mesAno' | 'dia'} formato
 * @param {unknown} iso
 * @param {string} fuso
 */
function formatarNoFuso(formato, iso, fuso) {
  const data = instante(iso);
  if (!data) {
    return null;
  }
  const partes = Object.fromEntries(
    formatador(formato, fuso || FUSO_PADRAO)
      .formatToParts(data)
      .map(({ type, value }) => [type, value]),
  );

  return formato === 'mesAno'
    ? `${partes.month}/${partes.year}`
    : `${partes.day}/${partes.month}/${partes.year}`;
}

/**
 * Instante ISO → `mm/aaaa` no fuso (`cliente_desde`).
 *
 * @param {unknown} iso
 * @param {string} [fuso]
 * @returns {string | null} `null` para ausente ou inválido
 */
export function formatarMesAno(iso, fuso = FUSO_PADRAO) {
  return formatarNoFuso('mesAno', iso, fuso);
}

/**
 * Instante ISO → `dd/mm/aaaa` no fuso (`ultima_compra`). Diferente de
 * `formatarData`, que lê o dia direto da string: aqui é instante de verdade.
 *
 * @param {unknown} iso
 * @param {string} [fuso]
 * @returns {string | null} `null` para ausente ou inválido
 */
export function formatarDiaNoFuso(iso, fuso = FUSO_PADRAO) {
  return formatarNoFuso('dia', iso, fuso);
}

/**
 * O papel vê "Data de conversão"? Sem ela, `cliente_desde`/`ultima_compra` não
 * vêm, as colunas de data somem e os filtros de data dão 400. Antes de `/fields`
 * chegar (`campos` ausente), não se sabe: vale o que a URL pediu.
 *
 * @param {{ chave: string }[] | null | undefined} campos todos os de `/fields`
 */
export function comDataConversao(campos) {
  return !campos || campos.some((campo) => campo.chave === CHAVE_DATA_CONVERSAO);
}

/**
 * Texto do chip do ciclo. Ciclo ausente ou desconhecido → `null` (nunca vira
 * "Lead"). Cliente com `cliente_desde` → "Cliente desde mm/aaaa"; sem a chave
 * (papel sem `dataConversao`) ou com data inválida → "Cliente".
 *
 * @param {Pick<import('../types.js').Lead, 'ciclo_de_vida' | 'cliente_desde'> | null | undefined} lead
 * @param {string} [fuso]
 * @returns {{ ciclo: string, texto: string } | null}
 */
export function textoDoCiclo(lead, fuso = FUSO_PADRAO) {
  const ciclo = lead?.ciclo_de_vida;
  if (typeof ciclo !== 'string' || !Object.hasOwn(ROTULOS_CICLO, ciclo)) {
    return null;
  }
  if (ciclo === CICLOS_DE_VIDA.CLIENTE) {
    const mesAno = formatarMesAno(lead.cliente_desde, fuso);
    return { ciclo, texto: mesAno ? textoClienteDesde(mesAno) : ROTULOS_CICLO[ciclo] };
  }

  return { ciclo, texto: ROTULOS_CICLO[ciclo] };
}

/**
 * Sem `dataConversao`, os filtros de data do ciclo dão 400: um link ou view
 * antiga não quebra a lista (molde: `filtroComValor`).
 *
 * @template {Record<string, unknown>} F
 * @param {F} filtro
 * @param {boolean} comData
 * @returns {F}
 */
export function filtroComDataConversao(filtro, comData) {
  if (comData) {
    return filtro;
  }

  return /** @type {F} */ (
    Object.fromEntries(
      Object.entries(filtro).filter(([chave]) => !CHAVES_DATA_CICLO.includes(chave)),
    )
  );
}
