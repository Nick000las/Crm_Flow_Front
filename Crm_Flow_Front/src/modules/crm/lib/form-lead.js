import { ACESSOS_CAMPO, CAMADA, CAMPOS_LGPD, CHAVE_SCORE, PARTES_ENDERECO, TIPOS_CAMPO } from '../constants.js';
import { lerValorDoCampo } from './colunas.js';
import {
  documentoSemMascara,
  formatarTelefone,
  mascararCep,
  mascararCnpj,
  mascararCpf,
  paraNumero,
} from './formatadores.js';
import { ehListaLivre, rotuloOpcao } from './opcoes.js';

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

/** Opt-out de marketing (LGPD): não é campo de `/fields`; no payload, sim/não. */
export const CHAVE_OPT_OUT = CAMPOS_LGPD.OPT_OUT;

/**
 * Dica abaixo do campo, por chave. `primeiroNome`: o back deriva do Nome
 * quando vazio (e rederiva ao mudar o Nome, se não foi editado à mão).
 */
export const AJUDA_POR_CHAVE = Object.freeze({
  primeiroNome: 'Vazio usa o primeiro nome do Nome.',
});

const PREFIXO_CUSTOM = 'custom.';
const DATA_ISO = /^\d{4}-\d{2}-\d{2}/;
const MILHAR_COM_PONTO = /^-?\d{1,3}(\.\d{3})+$/;
const CENTAVOS = 100;
/** O back só aceita telefone BR com DDD: fixo (10) ou celular (11), sem DDI. */
const DIGITOS_TELEFONE = Object.freeze([10, 11]);
const CHAVES_CONTATO = Object.freeze(['email', 'telefone']);
const TAMANHO_DIA = 10;
/** Tamanho do documento sem máscara (o back confere o DV). */
const TAMANHO_DOCUMENTO = Object.freeze({
  [TIPOS_CAMPO.CPF]: 11,
  [TIPOS_CAMPO.CNPJ]: 14,
  [TIPOS_CAMPO.CEP]: 8,
});
const MASCARA_DOCUMENTO = Object.freeze({
  [TIPOS_CAMPO.CPF]: mascararCpf,
  [TIPOS_CAMPO.CNPJ]: mascararCnpj,
  [TIPOS_CAMPO.CEP]: mascararCep,
});

export const MENSAGENS = Object.freeze({
  OBRIGATORIO: 'Campo obrigatório',
  CONTATO: 'Informe e-mail ou telefone',
  NUMERO_INVALIDO: 'Informe um número válido',
  TELEFONE_INVALIDO: 'Informe DDD e número (10 ou 11 dígitos)',
  CPF_INVALIDO: 'Informe os 11 dígitos do CPF',
  CNPJ_INVALIDO: 'Informe os 14 caracteres do CNPJ',
  CEP_INVALIDO: 'Informe os 8 dígitos do CEP',
  PERIODO_INCOMPLETO: 'Informe o início e o fim',
  PERIODO_INVERTIDO: 'O início precisa ser antes do fim',
});

const MENSAGEM_DOCUMENTO = Object.freeze({
  [TIPOS_CAMPO.CPF]: MENSAGENS.CPF_INVALIDO,
  [TIPOS_CAMPO.CNPJ]: MENSAGENS.CNPJ_INVALIDO,
  [TIPOS_CAMPO.CEP]: MENSAGENS.CEP_INVALIDO,
});

const textoDe = (valor) => (typeof valor === 'string' ? valor : '');
const diaDe = (valor) => (typeof valor === 'string' && DATA_ISO.test(valor) ? valor.slice(0, TAMANHO_DIA) : '');

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

/** Valor do lead (ou sugestão da Receita) → valor que o controle do tipo edita. */
export function paraValorDeForm(tipo, valor) {
  switch (tipo) {
    case TIPOS_CAMPO.NUMERO:
    case TIPOS_CAMPO.MONETARIO: {
      const numero = paraNumero(valor);
      return numero === null ? '' : String(numero).replace('.', ',');
    }
    case TIPOS_CAMPO.TELEFONE:
      // O back devolve só dígitos; o input mostra com máscara.
      return formatarTelefone(valor) ?? '';
    case TIPOS_CAMPO.DATA:
      return typeof valor === 'string' && DATA_ISO.test(valor) ? valor.slice(0, 10) : '';
    case TIPOS_CAMPO.BOOLEANO:
      // `null` (nunca preenchido) é diferente de `false`: o diff não pode
      // transformar "sem resposta" em "Não" só por abrir o form.
      return typeof valor === 'boolean' ? valor : null;
    case TIPOS_CAMPO.SELECAO_MULTIPLA:
      return Array.isArray(valor) ? valor.map(String) : [];
    // M11: o back grava sem máscara; o input mostra com.
    case TIPOS_CAMPO.CPF:
    case TIPOS_CAMPO.CNPJ:
    case TIPOS_CAMPO.CEP:
      return MASCARA_DOCUMENTO[tipo](textoDe(valor));
    case TIPOS_CAMPO.INTERVALO_DATAS:
      return { de: diaDe(valor?.de), ate: diaDe(valor?.ate) };
    case TIPOS_CAMPO.ENDERECO:
      return Object.fromEntries(
        PARTES_ENDERECO.map((parte) => {
          const texto = textoDe(valor?.[parte]);
          return [parte, parte === 'cep' ? mascararCep(texto) : texto];
        }),
      );
    default:
      return valor === null || valor === undefined ? '' : String(valor);
  }
}

/** Período: os dois lados vazios = sem valor; um lado só fica para a validação apontar. */
function periodoDeApi(valor) {
  const de = textoDe(valor?.de).trim();
  const ate = textoDe(valor?.ate).trim();
  return de || ate ? { de, ate } : null;
}

/** Endereço: só as partes preenchidas, CEP sem máscara e UF maiúscula; nenhuma = `null`. */
function enderecoDeApi(valor) {
  const partes = PARTES_ENDERECO.flatMap((parte) => {
    const texto = textoDe(valor?.[parte]).trim();
    if (!texto) return [];
    if (parte === 'cep') return [[parte, texto.replace(/\D/g, '')]];
    return [[parte, parte === 'uf' ? texto.toUpperCase() : texto]];
  });

  return partes.length > 0 ? Object.fromEntries(partes) : null;
}

/**
 * Valor do form → valor do payload. Vazio vira `null`. Telefone, e-mail, URL
 * e texto longo vão como texto aparado: o back normaliza (dígitos, minúsculas).
 *
 * @returns {unknown}
 */
export function paraValorDeApi(tipo, valor) {
  switch (tipo) {
    case TIPOS_CAMPO.NUMERO:
      return lerNumeroDigitado(valor ?? '');
    case TIPOS_CAMPO.MONETARIO: {
      // Reais com até 2 casas, como o back aceita.
      const numero = lerNumeroDigitado(valor ?? '');
      return numero === null || Number.isNaN(numero) ? numero : Math.round(numero * CENTAVOS) / CENTAVOS;
    }
    case TIPOS_CAMPO.BOOLEANO:
      return typeof valor === 'boolean' ? valor : null;
    case TIPOS_CAMPO.SELECAO_MULTIPLA:
      return Array.isArray(valor) && valor.length > 0 ? valor : null;
    case TIPOS_CAMPO.CPF:
    case TIPOS_CAMPO.CNPJ:
    case TIPOS_CAMPO.CEP:
      return documentoSemMascara(valor) || null;
    case TIPOS_CAMPO.INTERVALO_DATAS:
      return periodoDeApi(valor);
    case TIPOS_CAMPO.ENDERECO:
      return enderecoDeApi(valor);
    default: {
      const texto = String(valor ?? '').trim();
      return texto === '' ? null : texto;
    }
  }
}

/**
 * Estado inicial do form. Sem lead, é o form de criação vazio — e aí
 * `padroes` (por `chave`; a base legal padrão da LGPD) preenche o campo
 * que está no form.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {import('../types.js').Lead} [lead]
 * @param {Record<string, unknown>} [padroes]
 * @returns {Record<string, unknown>}
 */
export function valoresIniciais(campos, lead, padroes = {}) {
  const valores = Object.fromEntries(
    campos.map((campo) => {
      const valor = paraValorDeForm(campo.tipo, lead ? lerValorDoCampo(lead, campo) : null);
      // Tags voltam como keys; o form edita pelo nome, e o back casa o nome
      // de volta com a key (ou cria a tag, se for texto novo).
      const editavel = ehListaLivre(campo) ? valor.map((key) => rotuloOpcao(key, campo)) : valor;
      return [idNoForm(campo), editavel];
    }),
  );

  valores[CAMPO_VALOR.chave] = paraValorDeForm(CAMPO_VALOR.tipo, lead?.valor);
  valores[CHAVE_RESPONSAVEL] = lead?.usuario_responsavel_id ?? '';
  valores[CHAVE_OPT_OUT] = Boolean(lead?.marketing_opt_out_at);

  if (!lead) {
    for (const campo of campos) {
      const padrao = padroes[campo.chave];
      if (padrao !== undefined && padrao !== null && padrao !== '') valores[idNoForm(campo)] = padrao;
    }
  }

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
 * Pode editar o campo? `acesso: 'view'` (permissão por campo, M13) = só
 * ver: aparece desabilitado e nunca vai no payload — o back conta até o
 * `null` como "enviado" e responde 403. Sem `acesso` = editável. Também
 * travados: o calculado (Lead score com `crm.score`) e o `somenteLeitura`
 * (carimbado pelo back, LGPD).
 *
 * @param {{ acesso?: string, calculado?: boolean, somenteLeitura?: boolean }} campo
 */
export function podeEditarCampo(campo) {
  return campo.acesso !== ACESSOS_CAMPO.VER && !campo.calculado && !campo.somenteLeitura;
}

/**
 * Com `crm.score`, o Lead score é calculado pelas regras de pontuação: vira
 * só leitura (`calculado`), sai do payload (o back daria 400) e da validação.
 *
 * @template {{ chave: string }} T
 * @param {T[]} campos
 * @param {boolean} comScore
 * @returns {Array<T & { calculado?: true }>}
 */
export function marcarCalculados(campos, comScore) {
  if (!comScore) return campos;
  return campos.map((campo) => (campo.chave === CHAVE_SCORE ? { ...campo, calculado: true } : campo));
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

  for (const campo of [...campos.filter(podeEditarCampo), CAMPO_VALOR]) {
    const valor = paraValorDeApi(campo.tipo, valores[idNoForm(campo)]);
    if (valor !== null) atribuir(payload, campo, valor);
  }

  if (valores[CHAVE_RESPONSAVEL]) payload[CHAVE_RESPONSAVEL] = valores[CHAVE_RESPONSAVEL];
  // Opt-out: só quando marcado (desmarcado é o padrão de quem nunca saiu).
  if (valores[CHAVE_OPT_OUT] === true) payload[CHAVE_OPT_OUT] = true;

  return payload;
}

function iguais(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, indice) => item === b[indice]);
  }
  // Endereço e período: mesma ordem de chaves dos dois lados (`*DeApi`).
  if (a && b && typeof a === 'object' && typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);

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

  for (const campo of [...campos.filter(podeEditarCampo), CAMPO_VALOR]) {
    const id = idNoForm(campo);
    const antes = paraValorDeApi(campo.tipo, iniciais[id]);
    const depois = paraValorDeApi(campo.tipo, valores[id]);

    if (!iguais(antes, depois)) atribuir(payload, campo, depois);
  }

  const responsavelAntes = iniciais[CHAVE_RESPONSAVEL] || null;
  const responsavelDepois = valores[CHAVE_RESPONSAVEL] || null;
  if (responsavelAntes !== responsavelDepois) payload[CHAVE_RESPONSAVEL] = responsavelDepois;

  // Opt-out: só quando muda (religar mantém a data da primeira vez, no back).
  if (Boolean(iniciais[CHAVE_OPT_OUT]) !== Boolean(valores[CHAVE_OPT_OUT])) {
    payload[CHAVE_OPT_OUT] = Boolean(valores[CHAVE_OPT_OUT]);
  }

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

  // Campo só de ver: o usuário não tem como corrigir — não cobra nada dele.
  for (const campo of [...campos.filter(podeEditarCampo), CAMPO_VALOR]) {
    const id = idNoForm(campo);
    const valor = paraValorDeApi(campo.tipo, valores[id]);

    if (Number.isNaN(valor)) erros[id] = MENSAGENS.NUMERO_INVALIDO;
    else if (campo.tipo === TIPOS_CAMPO.TELEFONE && valor !== null && !telefoneValido(valor)) {
      erros[id] = MENSAGENS.TELEFONE_INVALIDO;
    }
    else if (valor !== null && erroDoTipo(campo.tipo, valor)) erros[id] = erroDoTipo(campo.tipo, valor);
    else if (campo.obrigatorio && valor === null) erros[id] = MENSAGENS.OBRIGATORIO;
  }

  // E-mail ou telefone: conta o que está no form (até o só de ver, que já
  // tem valor); o erro vai para o primeiro editável. Sem nenhum editável
  // (ocultos pela permissão), o back decide.
  const contatos = CHAVES_CONTATO.map((chave) => campos.find((campo) => campo.chave === chave)).filter(Boolean);
  const temContato = contatos.some(
    (campo) => paraValorDeApi(TIPOS_CAMPO.TEXTO, valores[idNoForm(campo)]) !== null,
  );
  const ondeAvisar = contatos.find(podeEditarCampo);
  if (!temContato && ondeAvisar) erros[idNoForm(ondeAvisar)] ??= MENSAGENS.CONTATO;

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
  idPorChave.set(CHAVE_OPT_OUT, CHAVE_OPT_OUT);

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

/**
 * Forma dos tipos do M11 (UX: o back confere o DV e responde 400 no campo).
 *
 * @returns {string | null}
 */
function erroDoTipo(tipo, valor) {
  if (TAMANHO_DOCUMENTO[tipo]) {
    return valor.length === TAMANHO_DOCUMENTO[tipo] ? null : MENSAGEM_DOCUMENTO[tipo];
  }
  if (tipo === TIPOS_CAMPO.INTERVALO_DATAS) {
    if (!valor.de || !valor.ate) return MENSAGENS.PERIODO_INCOMPLETO;
    return valor.de > valor.ate ? MENSAGENS.PERIODO_INVERTIDO : null;
  }
  if (tipo === TIPOS_CAMPO.ENDERECO && valor.cep) {
    return valor.cep.length === TAMANHO_DOCUMENTO[TIPOS_CAMPO.CEP] ? null : MENSAGENS.CEP_INVALIDO;
  }
  return null;
}

/** @param {string} texto */
function telefoneValido(texto) {
  return DIGITOS_TELEFONE.includes(texto.replace(/\D/g, '').length);
}
