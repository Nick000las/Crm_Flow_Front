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
const DIGITOS_CEP = 8;

const instanteFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/** Pontuação que um documento pode trazer gravada (`12.345.678/0001-90`). */
const PONTUACAO_DOCUMENTO = /[.\-/\s]/g;

/**
 * Aplica o molde só quando o texto, sem pontuação, tem exatamente `tamanho`
 * caracteres aceitos por `aceitos`. Dado antigo ou documento estrangeiro:
 * como veio.
 */
function moldar(valor, tamanho, regex, molde, aceitos = /^\d+$/) {
  if (valor === null || valor === undefined || valor === '') return null;

  const texto = String(valor);
  const limpo = texto.replace(PONTUACAO_DOCUMENTO, '').toUpperCase();
  return limpo.length === tamanho && aceitos.test(limpo) ? limpo.replace(regex, molde) : texto;
}

/** CNPJ alfanumérico (M11): 12 primeiros `[0-9A-Z]`, DV numérico — molde igual. */
const CNPJ_ACEITO = /^[0-9A-Z]+$/;

/** `12345678000190` → `12.345.678/0001-90`; `12ABC34501DE35` → `12.ABC.345/01DE-35`. */
export function formatarCnpj(valor) {
  return moldar(valor, DIGITOS_CNPJ, /^(.{2})(.{3})(.{3})(.{4})(.{2})$/, '$1.$2.$3/$4-$5', CNPJ_ACEITO);
}

/** `12345678909` → `123.456.789-09`. */
export function formatarCpf(valor) {
  return moldar(valor, DIGITOS_CPF, /^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

/** `01310100` → `01310-100`. */
export function formatarCep(valor) {
  return moldar(valor, DIGITOS_CEP, /^(\d{5})(\d{3})$/, '$1-$2');
}

/**
 * Máscara progressiva para o input: encaixa o que já foi digitado no molde
 * (`separadores` = posição → caractere inserido antes dela).
 */
function mascarar(limpo, separadores) {
  let saida = '';
  for (const [indice, caractere] of [...limpo].entries()) {
    saida += (separadores[indice] ?? '') + caractere;
  }
  return saida;
}

/** `123456789` → `123.456.789`, até `123.456.789-09`. */
export function mascararCpf(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, DIGITOS_CPF);
  return mascarar(digitos, { 3: '.', 6: '.', 9: '-' });
}

/** CNPJ numérico ou alfanumérico, em maiúsculas. */
export function mascararCnpj(valor) {
  const limpo = String(valor ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '')
    .slice(0, DIGITOS_CNPJ);
  return mascarar(limpo, { 2: '.', 5: '.', 8: '/', 12: '-' });
}

export function mascararCep(valor) {
  const digitos = String(valor ?? '').replace(/\D/g, '').slice(0, DIGITOS_CEP);
  return mascarar(digitos, { 5: '-' });
}

/** Documento sem pontuação, como o back grava (CNPJ em maiúsculas). */
export function documentoSemMascara(valor) {
  return String(valor ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, '');
}

/**
 * Período (`intervalo_datas`): "01/02/2026 a 10/02/2026". Só um lado (dado
 * de filtro): "a partir de"/"até".
 *
 * @param {{ de?: string, ate?: string } | null | undefined} valor
 */
export function formatarIntervalo(valor) {
  if (!valor || typeof valor !== 'object') return null;

  const de = formatarData(valor.de);
  const ate = formatarData(valor.ate);
  if (de && ate) return `${de} a ${ate}`;
  if (de) return `a partir de ${de}`;
  return ate ? `até ${ate}` : null;
}

/**
 * Endereço em uma linha: "Rua X, 123, apto 4 - Centro, São Paulo/SP, 01310-100".
 * Só as partes preenchidas.
 *
 * @param {Record<string, string> | null | undefined} valor
 */
export function formatarEndereco(valor) {
  if (!valor || typeof valor !== 'object') return null;

  const parte = (nome) => (typeof valor[nome] === 'string' ? valor[nome].trim() : '');
  const rua = [parte('logradouro'), parte('numero'), parte('complemento')].filter(Boolean).join(', ');
  const local = [parte('cidade'), parte('uf')].filter(Boolean).join('/');
  const blocos = [[rua, parte('bairro')].filter(Boolean).join(' - '), local, formatarCep(parte('cep')) ?? ''];

  return blocos.filter(Boolean).join(', ') || null;
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
