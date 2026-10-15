import { CAMADA, TIPOS_CAMPO } from '../constants.js';
import { lerValorDoCampo } from './colunas.js';
import { paraNumero } from './formatadores.js';

/**
 * Ponte entre três formas do mesmo dado:
 * - **lead lido** (snake_case, NUMERIC em string, data como timestamp);
 * - **valores do form** (o que cada controle edita: string, boolean, string[]);
 * - **payload** (chave camelCase na raiz; Camada 3 em `customFields`).
 *
 * Tudo aqui é puro. O form itera `/crm/leads/fields` sem saber a camada de
 * cada campo; só o payload separa a Camada 3.
 */

/** Campos do form que não vêm de `/fields`. */
export const CAMPO_VALOR = Object.freeze({
  chave: 'valor',
  label: 'Valor',
  tipo: TIPOS_CAMPO.NUMERO,
  obrigatorio: false,
});
export const CHAVE_RESPONSAVEL = 'usuarioResponsavelId';

const PREFIXO_CUSTOM = 'custom.';
const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;
const MILHAR_COM_PONTO = /^-?\d{1,3}(\.\d{3})+$/;
const CHAVES_CONTATO = Object.freeze(['email', 'telefone']);

export const MENSAGENS = Object.freeze({
  OBRIGATORIO: 'Campo obrigatório',
  CONTATO: 'Informe e-mail ou telefone',
  NUMERO_INVALIDO: 'Informe um número válido',
});

/**
 * Id do campo no estado do form. A Camada 3 ganha prefixo para nunca colidir
 * com uma chave nativa.
 *
 * @param {import('../types.js').Campo} campo
 */
export function idNoForm(campo) {
  return campo.camada === CAMADA.CAMADA_3 ? `${PREFIXO_CUSTOM}${campo.chave}` : campo.chave;
}

/**
 * `1.234,56` e `1234.56` viram 1234.56. Texto vazio vira `null`; texto que
 * não é número vira `NaN` (o form barra antes de enviar).
 *
 * @param {string} texto
 */
export function lerNumeroDigitado(texto) {
  const limpo = String(texto).replace(/\s/g, '');
  if (limpo === '') return null;

  // Vírgula presente: pt-BR (ponto é milhar). Sem vírgula, ponto agrupando
  // de 3 em 3 (`2.000`, `1.234.567`) também é milhar; fora isso, é decimal.
  const usaMilharComPonto = limpo.includes(',') || MILHAR_COM_PONTO.test(limpo);
  const normalizado = usaMilharComPonto
    ? limpo.replaceAll('.', '').replace(',', '.')
    : limpo;

  return /^-?\d+(\.\d+)?$/.test(normalizado) ? Number(normalizado) : Number.NaN;
}

/** Valor do lead → valor que o controle do tipo edita. */
function paraValorDeForm(tipo, valor) {
  switch (tipo) {
    case TIPOS_CAMPO.NUMERO: {
      const numero = paraNumero(valor);
      return numero === null ? '' : String(numero).replace('.', ',');
    }
    case TIPOS_CAMPO.DATA:
      return typeof valor === 'string' && DATA_ISO.test(valor) ? valor.slice(0, 10) : '';
    case TIPOS_CAMPO.BOOLEANO:
      // `null` (nunca preenchido) é diferente de `false`: o diff não pode
      // transformar "sem resposta" em "Não" só por abrir o form.
      return typeof valor === 'boolean' ? valor : null;
    case TIPOS_CAMPO.SELECAO_MULTIPLA:
      return Array.isArray(valor) ? valor.map(String) : [];
    default:
      return valor === null || valor === undefined ? '' : String(valor);
  }
}

/**
 * Valor do form → valor do payload. Vazio vira `null`.
 *
 * @returns {unknown}
 */
export function paraValorDeApi(tipo, valor) {
  switch (tipo) {
    case TIPOS_CAMPO.NUMERO:
      return lerNumeroDigitado(valor ?? '');
    case TIPOS_CAMPO.BOOLEANO:
      return typeof valor === 'boolean' ? valor : null;
    case TIPOS_CAMPO.SELECAO_MULTIPLA:
      return Array.isArray(valor) && valor.length > 0 ? valor : null;
    default: {
      const texto = String(valor ?? '').trim();
      return texto === '' ? null : texto;
    }
  }
}

/**
 * Estado inicial do form. Sem lead, é o form de criação vazio.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {import('../types.js').Lead} [lead]
 * @returns {Record<string, unknown>}
 */
export function valoresIniciais(campos, lead) {
  const valores = Object.fromEntries(
    campos.map((campo) => [
      idNoForm(campo),
      paraValorDeForm(campo.tipo, lead ? lerValorDoCampo(lead, campo) : null),
    ]),
  );

  valores[CAMPO_VALOR.chave] = paraValorDeForm(CAMPO_VALOR.tipo, lead?.valor);
  valores[CHAVE_RESPONSAVEL] = lead?.usuario_responsavel_id ?? '';

  return valores;
}

/** Coloca `valor` no lugar certo do payload (raiz ou `customFields`). */
function atribuir(payload, campo, valor) {
  if (campo.camada === CAMADA.CAMADA_3) {
    payload.customFields = { ...payload.customFields, [campo.chave]: valor };
  } else {
    payload[campo.chave] = valor;
  }
}

/**
 * Payload de criação: só o que foi preenchido. Sem responsável, o back usa
 * quem está criando.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {Record<string, unknown>} valores
 */
export function montarPayloadCriacao(campos, valores) {
  const payload = {};

  for (const campo of [...campos, CAMPO_VALOR]) {
    const valor = paraValorDeApi(campo.tipo, valores[idNoForm(campo)]);
    if (valor !== null) atribuir(payload, campo, valor);
  }

  if (valores[CHAVE_RESPONSAVEL]) payload[CHAVE_RESPONSAVEL] = valores[CHAVE_RESPONSAVEL];

  return payload;
}

function iguais(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, indice) => item === b[indice]);
  }

  return a === b;
}

/**
 * Payload de edição: **diff** contra o estado inicial. Campo intocado não
 * vai; campo esvaziado vai como `null`, que limpa no back (na Camada 3,
 * `customFields: { chave: null }`).
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {Record<string, unknown>} iniciais
 * @param {Record<string, unknown>} valores
 */
export function montarPayloadEdicao(campos, iniciais, valores) {
  const payload = {};

  for (const campo of [...campos, CAMPO_VALOR]) {
    const id = idNoForm(campo);
    const antes = paraValorDeApi(campo.tipo, iniciais[id]);
    const depois = paraValorDeApi(campo.tipo, valores[id]);

    if (!iguais(antes, depois)) atribuir(payload, campo, depois);
  }

  const responsavelAntes = iniciais[CHAVE_RESPONSAVEL] || null;
  const responsavelDepois = valores[CHAVE_RESPONSAVEL] || null;
  if (responsavelAntes !== responsavelDepois) payload[CHAVE_RESPONSAVEL] = responsavelDepois;

  return payload;
}

/** @param {object} payload */
export function payloadVazio(payload) {
  return Object.keys(payload).length === 0;
}

/**
 * Validação **só de UX**, antes de gastar uma ida ao back — quem valida de
 * verdade é o servidor. Devolve `{ [idNoForm]: mensagem }`.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {Record<string, unknown>} valores
 */
export function validarNoCliente(campos, valores) {
  const erros = {};

  for (const campo of [...campos, CAMPO_VALOR]) {
    const id = idNoForm(campo);
    const valor = paraValorDeApi(campo.tipo, valores[id]);

    if (Number.isNaN(valor)) erros[id] = MENSAGENS.NUMERO_INVALIDO;
    else if (campo.obrigatorio && valor === null) erros[id] = MENSAGENS.OBRIGATORIO;
  }

  const temContato = CHAVES_CONTATO.some(
    (chave) => paraValorDeApi(TIPOS_CAMPO.TEXTO, valores[chave]) !== null,
  );
  if (!temContato) erros.email ??= MENSAGENS.CONTATO;

  return erros;
}

/**
 * Distribui `ApiError.fields` pelos campos do form. As chaves do back são
 * camelCase das Camadas 1/2, `valor` e `usuarioResponsavelId`; o que não tem
 * campo próprio (`customFields` — a mensagem já cita o rótulo —,
 * `funilEstagioId`) vai para a lista geral, exibida no topo do form.
 *
 * @param {Record<string, string[]> | undefined} fields
 * @param {import('../types.js').Campo[]} campos
 * @returns {{ porCampo: Record<string, string>, gerais: string[] }}
 */
export function errosDoServidor(fields, campos) {
  const idPorChave = new Map(
    campos
      .filter((campo) => campo.camada !== CAMADA.CAMADA_3)
      .map((campo) => [campo.chave, idNoForm(campo)]),
  );
  idPorChave.set(CAMPO_VALOR.chave, CAMPO_VALOR.chave);
  idPorChave.set(CHAVE_RESPONSAVEL, CHAVE_RESPONSAVEL);

  const porCampo = {};
  const gerais = [];

  for (const [chave, mensagens] of Object.entries(fields ?? {})) {
    const mensagem = mensagens?.[0];
    if (!mensagem) continue;

    if (idPorChave.has(chave)) porCampo[idPorChave.get(chave)] = mensagem;
    else gerais.push(mensagem);
  }

  return { porCampo, gerais };
}
