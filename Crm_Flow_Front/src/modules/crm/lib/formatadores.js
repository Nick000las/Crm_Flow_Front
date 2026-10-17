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

const DDD = 2;
const TELEFONE_FIXO = 10;
const TELEFONE_CELULAR = 11;
const PROTOCOLOS_SEGUROS = Object.freeze(['http:', 'https:']);

/**
 * Máscara BR progressiva, para o input: aplica o que der com os dígitos que
 * já existem (`11`, `(11) 9`, `(11) 9234-5`, `(11) 92345-6789`).
 *
 * @param {unknown} valor
 */
export function mascararTelefone(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, TELEFONE_CELULAR);
  if (digitos.length <= DDD) return digitos;

  const ddd = digitos.slice(0, DDD);
  const numero = digitos.slice(DDD);
  // Com 11 dígitos o prefixo tem 5; até lá, 4 (fixo).
  const tamanhoPrefixo = digitos.length === TELEFONE_CELULAR ? 5 : 4;

  if (numero.length <= tamanhoPrefixo) return `(${ddd}) ${numero}`;

  return `(${ddd}) ${numero.slice(0, tamanhoPrefixo)}-${numero.slice(tamanhoPrefixo)}`;
}

/**
 * Telefone gravado pelo back (só dígitos, sem DDI) para exibição. Fora de
 * 10/11 dígitos (dado antigo, número estrangeiro), mostra como veio.
 *
 * @param {unknown} valor
 * @returns {string | null}
 */
export function formatarTelefone(valor) {
  if (valor === null || valor === undefined || valor === '') return null;

  const texto = String(valor);
  const digitos = texto.replace(/\D/g, '');
  const conhecido = digitos.length === TELEFONE_FIXO || digitos.length === TELEFONE_CELULAR;

  return conhecido ? mascararTelefone(digitos) : texto;
}

/**
 * Só `http`/`https` viram link — `javascript:` e afins nunca chegam a um `href`.
 *
 * @param {unknown} valor
 * @returns {string | null} a URL normalizada, ou `null`
 */
export function urlSegura(valor) {
  if (typeof valor !== 'string' || valor.trim() === '') return null;

  try {
    const url = new URL(valor.trim());
    return PROTOCOLOS_SEGUROS.includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

const DIGITOS_CNPJ = 14;
const DIGITOS_CPF = 11;

const instanteFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/** Pontuação que um documento pode trazer gravada (`12.345.678/0001-90`). */
const PONTUACAO_DOCUMENTO = /[.\-/\s]/g;

/**
 * Aplica o molde só quando o texto, sem pontuação, tem exatamente `tamanho`
 * dígitos. CNPJ alfanumérico, dado antigo ou documento estrangeiro: como veio.
 */
function moldar(valor, tamanho, regex, molde) {
  if (valor === null || valor === undefined || valor === '') return null;

  const texto = String(valor);
  const limpo = texto.replace(PONTUACAO_DOCUMENTO, '');
  return limpo.length === tamanho && /^\d+$/.test(limpo) ? limpo.replace(regex, molde) : texto;
}

/** `12345678000190` → `12.345.678/0001-90`. */
export function formatarCnpj(valor) {
  return moldar(valor, DIGITOS_CNPJ, /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

/** `12345678909` → `123.456.789-09`. */
export function formatarCpf(valor) {
  return moldar(valor, DIGITOS_CPF, /^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/**
 * `created_at`/`updated_at` são instantes de verdade (com fuso), ao contrário
 * das datas de campo: aqui sim a data é a do fuso de quem está vendo.
 *
 * @param {unknown} valor ISO 8601
 * @returns {string | null} `dd/MM/aaaa`
 */
export function formatarInstante(valor) {
  if (typeof valor !== 'string' || valor === '') return null;

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : instanteFormatter.format(data);
}
