const DATA_ISO = /^(\d{4})-(\d{2})-(\d{2})/;

const numeroFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
});

const moedaFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/**
 * NUMERIC do Postgres chega como string no JSON (`"1500.00"`).
 *
 * @param {unknown} valor
 * @returns {number | null}
 */
export function paraNumero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  const numero = typeof valor === 'number' ? valor : Number(valor);

  return Number.isFinite(numero) ? numero : null;
}

/**
 * As datas do lead são `TIMESTAMP` sem fuso, serializadas como
 * `2026-10-14T00:00:00.000Z`. Passar isso por `new Date` e formatar no fuso
 * local "volta um dia" no Brasil — por isso a data é lida direto da string.
 *
 * @param {unknown} valor
 * @returns {string | null} `dd/MM/aaaa`
 */
export function formatarData(valor) {
  if (typeof valor !== 'string') return null;

  const partes = DATA_ISO.exec(valor);
  if (!partes) return null;

  const [, ano, mes, dia] = partes;

  return `${dia}/${mes}/${ano}`;
}

/** @param {unknown} valor */
export function formatarNumero(valor) {
  const numero = paraNumero(valor);

  return numero === null ? null : numeroFormatter.format(numero);
}

/** @param {unknown} valor */
export function formatarMoeda(valor) {
  const numero = paraNumero(valor);

  return numero === null ? null : moedaFormatter.format(numero);
}
