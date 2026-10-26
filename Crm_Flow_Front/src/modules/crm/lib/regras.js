import { CAMADA, ROTULOS_CATEGORIA, TIPOS_CAMPO, TIPOS_REGRA } from '../constants.js';
import { lerValorDoCampo } from './colunas.js';
import { OPERADOR, descreverItem, itemDaLinha, linhaDoItem, operadoresDoCampo, valorVazio } from './filtro.js';
import { idNoForm, paraValorDeApi } from './form-lead.js';
import { ehListaLivre, opcaoDoCampo, rotuloOpcao } from './opcoes.js';

/**
 * Regras de campo (`crm.regras`): "Status = Perdido exige Motivo" e "se A =
 * X, B fica obrigatório e/ou só aparece então". O avaliador é ESPELHO de
 * `avaliarRegras` do back (`services/regras-campos.service.js`) — os dois
 * rodam os casos de `regras.casos.json`. Aqui é só UX (esconder, marcar
 * obrigatório); quem valida é o back, com 400 no campo.
 *
 * O lead é avaliado no formato da API: Camadas 1/2 pela `chave`,
 * personalizado em `customFields[chave]`.
 *
 * @typedef {{ id: string, chave: string, label: string, tipo: string, camada: number }} CampoDaRegra
 * @typedef {{
 *   id: string,
 *   kind: 'required_from_status' | 'conditional',
 *   ativo: boolean,
 *   sistema: boolean,
 *   alvo: CampoDaRegra,
 *   condicao: { status?: string[], categorias?: string[] }
 *     | { campo: CampoDaRegra, operador: string, valor?: unknown },
 *   efeito: { obrigatorio?: boolean, visivel?: boolean },
 * }} Regra  formato de `GET /crm/configuracoes/regras`
 */

// ---------------------------------------------------------------------------
// Avaliador (espelho do back)

const TAMANHO_DIA = 10;

const textoNormalizado = (valor) => String(valor).trim().toLowerCase();
const diaDe = (valor) => (valor instanceof Date ? valor.toISOString() : String(valor)).slice(0, TAMANHO_DIA);
const somenteDigitos = (texto) => texto.replace(/\D/g, '');
/** CNPJ (M11, alfanumérico): sem pontuação e em maiúsculas — `chaveDocumento` do back. */
const chaveDocumento = (texto) => texto.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
const PADRAO_HORA = /^(\d{1,2}):(\d{2})(?::\d{2})?$/;
const HORAS_NO_DIA = 24;
const MINUTOS_NA_HORA = 60;

/** `9:05`, `09:05` ou `09:05:30` → `09:05`; inválida → `null` (`normalizarHora` do back). */
function normalizarHora(texto) {
  const partes = PADRAO_HORA.exec(texto.trim());
  if (!partes) return null;
  const [horas, minutos] = [Number(partes[1]), Number(partes[2])];
  if (horas >= HORAS_NO_DIA || minutos >= MINUTOS_NA_HORA) return null;
  return `${String(horas).padStart(2, '0')}:${partes[2]}`;
}

const objetoSimples = (valor) => typeof valor === 'object' && valor !== null && !Array.isArray(valor);

/**
 * Vazio para fins de obrigatoriedade: ausente, `null`, texto vazio, lista
 * vazia ou objeto (endereço, período) sem nenhuma parte preenchida.
 */
export function valorAusente(valor) {
  if (valor === undefined || valor === null || valor === '') return true;
  if (Array.isArray(valor)) return valor.length === 0;
  if (objetoSimples(valor)) return Object.values(valor).every(valorAusente);
  return false;
}

function comparavel(tipo, valor) {
  switch (tipo) {
    case TIPOS_CAMPO.NUMERO:
    case TIPOS_CAMPO.MONETARIO:
      return Number(valor);
    case TIPOS_CAMPO.DATA:
      return diaDe(valor);
    case TIPOS_CAMPO.BOOLEANO:
      return Boolean(valor);
    case TIPOS_CAMPO.TELEFONE:
    case TIPOS_CAMPO.CPF:
    case TIPOS_CAMPO.CEP:
      return somenteDigitos(String(valor));
    case TIPOS_CAMPO.CNPJ:
      return chaveDocumento(String(valor));
    case TIPOS_CAMPO.HORA:
      return normalizarHora(String(valor)) ?? String(valor);
    // Endereço: só os valores das partes, como o filtro.
    case TIPOS_CAMPO.ENDERECO:
      return textoNormalizado(objetoSimples(valor) ? Object.values(valor).join(' ') : valor);
    case TIPOS_CAMPO.SELECAO:
      return valor;
    default:
      return textoNormalizado(valor);
  }
}

/**
 * Mesmos operadores e mesmo sentido do filtro, avaliados sobre um lead.
 *
 * @param {string} tipo tipo do campo da condição
 * @param {string} operador
 * @param {unknown} valorRegra
 * @param {unknown} valorLead
 */
export function avaliarCondicao(tipo, operador, valorRegra, valorLead) {
  const ausente = valorAusente(valorLead);
  if (operador === OPERADOR.VAZIO) return ausente;
  if (operador === OPERADOR.NAO_VAZIO) return !ausente;
  if (ausente) return false;

  const lista = Array.isArray(valorLead) ? valorLead : null;
  switch (operador) {
    case OPERADOR.IGUAL:
      return comparavel(tipo, valorLead) === comparavel(tipo, valorRegra);
    case OPERADOR.CONTEM:
      return lista
        ? lista.includes(valorRegra)
        : textoNormalizado(comparavel(tipo, valorLead)).includes(textoNormalizado(comparavel(tipo, valorRegra)));
    case OPERADOR.E_UM_DOS: {
      const opcoes = (Array.isArray(valorRegra) ? valorRegra : []).map((item) => comparavel(tipo, item));
      return lista ? lista.some((item) => opcoes.includes(item)) : opcoes.includes(comparavel(tipo, valorLead));
    }
    case OPERADOR.ENTRE: {
      const { de, ate } = valorRegra ?? {};
      if (tipo === TIPOS_CAMPO.INTERVALO_DATAS) {
        // Sobreposição: o período começa até o fim da regra e termina depois do início dela.
        const comecaAntesDoFim = ate === undefined || ate === null || diaDe(valorLead.de) <= diaDe(ate);
        const terminaDepoisDoInicio = de === undefined || de === null || diaDe(valorLead.ate) >= diaDe(de);
        return comecaAntesDoFim && terminaDepoisDoInicio;
      }
      const atual = comparavel(tipo, valorLead);
      const depoisDoInicio = de === undefined || de === null || atual >= comparavel(tipo, de);
      const antesDoFim = ate === undefined || ate === null || atual <= comparavel(tipo, ate);
      return depoisDoInicio && antesDoFim;
    }
    default:
      return false;
  }
}

/** @param {Record<string, any>} lead formato da API @param {CampoDaRegra} campo */
export function valorDoCampo(lead, campo) {
  return campo.camada === CAMADA.CAMADA_3 ? lead.customFields?.[campo.chave] : lead[campo.chave];
}

function regraCasa(regra, lead, { categoriaDoStatus = null }) {
  if (regra.kind === TIPOS_REGRA.POR_STATUS) {
    const { status = [], categorias = [] } = regra.condicao;
    return (
      (lead.status != null && status.includes(lead.status)) ||
      (categoriaDoStatus != null && categorias.includes(categoriaDoStatus))
    );
  }
  const { campo, operador, valor } = regra.condicao;
  return avaliarCondicao(campo.tipo, operador, valor, valorDoCampo(lead, campo));
}

/**
 * Obrigatório: alguma regra ativa com `efeito.obrigatorio` casa. Oculto: o
 * campo tem regra com `efeito.visivel` e nenhuma delas casa ("só aparece
 * quando..."). Oculto nunca é obrigatório. Chaves em ordem alfabética.
 *
 * @param {Regra[]} regras
 * @param {Record<string, any>} lead formato da API (na edição, o atual + o que mudou)
 * @param {{ categoriaDoStatus?: string | null }} [contexto]
 * @returns {{ obrigatorios: string[], ocultos: string[] }}
 */
export function avaliarRegras(regras, lead, contexto = {}) {
  const obrigatorios = new Set();
  const visibilidade = new Map();

  for (const regra of regras) {
    if (!regra.ativo) continue;
    const casa = regraCasa(regra, lead, contexto);
    const { chave } = regra.alvo;
    if (regra.efeito.visivel) visibilidade.set(chave, (visibilidade.get(chave) ?? false) || casa);
    if (regra.efeito.obrigatorio && casa) obrigatorios.add(chave);
  }

  const ocultos = [...visibilidade].filter(([, visivel]) => !visivel).map(([chave]) => chave);
  for (const chave of ocultos) obrigatorios.delete(chave);
  return { obrigatorios: [...obrigatorios].sort(), ocultos: ocultos.sort() };
}

// ---------------------------------------------------------------------------
// Ponte com o form do lead

const campoDoStatus = (campos) =>
  campos.find((campo) => campo.chave === 'status' && campo.camada !== CAMADA.CAMADA_3);

/**
 * Categoria (`aberto`/`ganho`/`perdido`) do status do lead, pela
 * `opcoesLista` do campo Status de `/fields`.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {unknown} status
 */
export function categoriaDoStatus(campos, status) {
  return opcaoDoCampo(campoDoStatus(campos), status)?.category ?? null;
}

/** Tags: o form edita pelo nome; a regra compara pela key. */
function keysDasTags(campo, nomes) {
  const porNome = new Map((campo.opcoesLista ?? []).map((opcao) => [textoNormalizado(opcao.label), opcao.key]));
  return nomes.map((nome) => porNome.get(textoNormalizado(nome)) ?? nome);
}

/**
 * O lead que o back avaliaria: o atual (na edição) coberto pelo que está
 * no form, no formato da API. Campos fora do form (outro contexto) ficam
 * com o valor atual.
 *
 * @param {import('../types.js').Campo[]} todosCampos os de `/fields`
 * @param {import('../types.js').Lead | undefined} leadAtual
 * @param {import('../types.js').Campo[]} camposDoForm
 * @param {Record<string, unknown>} valores
 * @returns {Record<string, any>}
 */
export function leadParaAvaliar(todosCampos, leadAtual, camposDoForm, valores) {
  const lead = {};
  const customFields = {};
  const atribuir = (campo, valor) => {
    if (campo.camada === CAMADA.CAMADA_3) customFields[campo.chave] = valor;
    else lead[campo.chave] = valor;
  };

  if (leadAtual) for (const campo of todosCampos) atribuir(campo, lerValorDoCampo(leadAtual, campo));
  for (const campo of camposDoForm) {
    const bruto = valores[idNoForm(campo)];
    const valor = ehListaLivre(campo) && Array.isArray(bruto) ? keysDasTags(campo, bruto) : bruto;
    atribuir(campo, paraValorDeApi(campo.tipo, valor));
  }

  return { ...lead, customFields };
}

/**
 * O que as regras dizem ao form agora: o lead resultante (atual + form) e a
 * categoria do status dele, avaliados como o back faria ao salvar.
 *
 * @param {Regra[]} regras
 * @param {import('../types.js').Campo[]} todosCampos
 * @param {import('../types.js').Lead | undefined} leadAtual `undefined` na criação
 * @param {import('../types.js').Campo[]} camposDoForm
 * @param {Record<string, unknown>} valores
 */
export function avaliarNoForm(regras, todosCampos, leadAtual, camposDoForm, valores) {
  const lead = leadParaAvaliar(todosCampos, leadAtual, camposDoForm, valores);
  return avaliarRegras(regras, lead, { categoriaDoStatus: categoriaDoStatus(todosCampos, lead.status) });
}

/**
 * Campos que o form mostra: sem os ocultos, e com o asterisco das regras
 * (`obrigatorio`), que também liga a checagem de vazio do cliente.
 *
 * @param {import('../types.js').Campo[]} campos
 * @param {{ obrigatorios: string[], ocultos: string[] }} avaliacao
 */
export function camposComRegras(campos, { obrigatorios, ocultos }) {
  const ocultas = new Set(ocultos);
  const exigidas = new Set(obrigatorios);

  return campos
    .filter((campo) => !ocultas.has(campo.chave))
    .map((campo) => (!campo.obrigatorio && exigidas.has(campo.chave) ? { ...campo, obrigatorio: true } : campo));
}

// ---------------------------------------------------------------------------
// Configurações › Regras

const juntarComOu = (partes) =>
  partes.length <= 1 ? (partes[0] ?? '') : `${partes.slice(0, -1).join(', ')} ou ${partes.at(-1)}`;

/**
 * Frase da regra para a lista: "Obrigatório quando o status é Proposta ou
 * um status perdido", "Só aparece quando Origem é Evento".
 *
 * @param {Regra} regra
 * @param {import('../types.js').Campo[]} campos os de `/fields` (rótulos atuais)
 */
export function descreverRegra(regra, campos) {
  if (regra.kind === TIPOS_REGRA.POR_STATUS) {
    const { status = [], categorias = [] } = regra.condicao;
    const doStatus = campoDoStatus(campos);
    const partes = [
      ...status.map((key) => rotuloOpcao(key, doStatus)),
      ...categorias.map((categoria) => `um status ${(ROTULOS_CATEGORIA[categoria] ?? categoria).toLowerCase()}`),
    ];
    return `Obrigatório quando o status é ${juntarComOu(partes)}`;
  }

  const { campo, operador, valor } = regra.condicao;
  const doSchema = campos.find((atual) => atual.id === campo.id) ?? campo;
  const condicao = descreverItem({ chave: campo.chave, operador, valor }, doSchema);
  const { obrigatorio, visivel } = regra.efeito;
  const efeito = obrigatorio && visivel ? 'Obrigatório e só aparece' : obrigatorio ? 'Obrigatório' : 'Só aparece';
  return `${efeito} quando ${condicao}`;
}

export const MENSAGENS_REGRA = Object.freeze({
  CAMPO: 'Escolha o campo',
  STATUS: 'Escolha ao menos um status ou uma categoria',
  CAMPO_CONDICAO: 'Escolha o campo da condição',
  MESMO_CAMPO: 'A condição precisa ser de outro campo',
  EFEITO: 'Escolha ao menos um efeito',
});

/**
 * @typedef {{
 *   kind: 'required_from_status' | 'conditional',
 *   campoId: string,
 *   status: string[],
 *   categorias: string[],
 *   condicao: { campoId: string, operador: string, valor: unknown },
 *   obrigatorio: boolean,
 *   visivel: boolean,
 * }} ValoresRegra  estado do form; `condicao.valor` no formato do construtor de filtro
 */

const CONDICAO_VAZIA = Object.freeze({ campoId: '', operador: '', valor: null });

/** Condição vazia para um campo: o primeiro operador do tipo dele. */
export function condicaoDoCampo(campo) {
  if (!campo) return { ...CONDICAO_VAZIA };
  const [operador] = operadoresDoCampo(campo);
  return { campoId: campo.id, operador, valor: valorVazio(operador, campo) };
}

/**
 * @param {Regra | null | undefined} regra
 * @param {import('../types.js').Campo[]} campos
 * @param {'required_from_status' | 'conditional'} [kind] tipo de uma regra nova
 * @returns {ValoresRegra}
 */
export function valoresDaRegra(regra, campos, kind = TIPOS_REGRA.POR_STATUS) {
  const base = {
    kind: regra?.kind ?? kind,
    campoId: regra?.alvo.id ?? '',
    status: [],
    categorias: [],
    condicao: { ...CONDICAO_VAZIA },
    obrigatorio: true,
    visivel: false,
  };
  if (!regra) return base;

  if (regra.kind === TIPOS_REGRA.POR_STATUS) {
    return { ...base, status: regra.condicao.status ?? [], categorias: regra.condicao.categorias ?? [] };
  }

  const { campo, operador, valor } = regra.condicao;
  const doSchema = campos.find((atual) => atual.id === campo.id) ?? campo;
  const linha = linhaDoItem({ chave: campo.chave, operador, valor }, doSchema);
  return {
    ...base,
    condicao: { campoId: campo.id, operador, valor: linha.valor },
    obrigatorio: Boolean(regra.efeito.obrigatorio),
    visivel: Boolean(regra.efeito.visivel),
  };
}

/**
 * Condição do form → `{ valor }` do contrato, ou `{ erro }`. Também a das
 * regras de distribuição (M12, mesmo formato).
 *
 * @param {{ campoId: string, operador: string, valor: unknown }} condicao
 * @param {import('../types.js').Campo[]} campos
 * @returns {{ valor: unknown } | { erro: string }}
 */
export function valorDaCondicao(condicao, campos) {
  const campo = campos.find((atual) => atual.id === condicao.campoId);
  if (!campo) return { erro: MENSAGENS_REGRA.CAMPO_CONDICAO };
  const resultado = itemDaLinha({ chave: campo.chave, operador: condicao.operador, valor: condicao.valor }, campo);
  return 'erro' in resultado ? resultado : { valor: resultado.item.valor };
}

/**
 * @param {ValoresRegra} valores
 * @param {import('../types.js').Campo[]} campos
 * @returns {Record<string, string>}
 */
export function validarRegra(valores, campos) {
  const erros = {};
  if (!valores.campoId) erros.campoId = MENSAGENS_REGRA.CAMPO;

  if (valores.kind === TIPOS_REGRA.POR_STATUS) {
    if (valores.status.length === 0 && valores.categorias.length === 0) erros.condicao = MENSAGENS_REGRA.STATUS;
    return erros;
  }

  const { campoId } = valores.condicao;
  if (!campoId || !campos.some((campo) => campo.id === campoId)) erros['condicao.campoId'] = MENSAGENS_REGRA.CAMPO_CONDICAO;
  else if (campoId === valores.campoId) erros['condicao.campoId'] = MENSAGENS_REGRA.MESMO_CAMPO;
  else {
    const resultado = valorDaCondicao(valores.condicao, campos);
    if ('erro' in resultado) erros['condicao.valor'] = resultado.erro;
  }
  if (!valores.obrigatorio && !valores.visivel) erros.efeito = MENSAGENS_REGRA.EFEITO;

  return erros;
}

function corpoCompleto(valores, campos) {
  if (valores.kind === TIPOS_REGRA.POR_STATUS) {
    return {
      kind: valores.kind,
      campoId: valores.campoId,
      condicao: {
        ...(valores.status.length > 0 && { status: valores.status }),
        ...(valores.categorias.length > 0 && { categorias: valores.categorias }),
      },
    };
  }

  const { valor } = valorDaCondicao(valores.condicao, campos);
  return {
    kind: valores.kind,
    campoId: valores.campoId,
    condicao: {
      campoId: valores.condicao.campoId,
      operador: valores.condicao.operador,
      ...(valor !== undefined && { valor }),
    },
    efeito: { obrigatorio: valores.obrigatorio, visivel: valores.visivel },
  };
}

/**
 * Corpo do POST (sem `original`) ou do PUT parcial (com `original`, sem o
 * `kind`, que não muda). `null` = nada mudou. Chame depois de `validarRegra`.
 *
 * @param {ValoresRegra} valores
 * @param {import('../types.js').Campo[]} campos
 * @param {Regra | null} [original]
 */
export function payloadDaRegra(valores, campos, original = null) {
  const corpo = corpoCompleto(valores, campos);
  if (!original) return corpo;

  const antes = corpoCompleto(valoresDaRegra(original, campos), campos);
  const parcial = Object.fromEntries(
    Object.entries(corpo).filter(([parte, valor]) => parte !== 'kind' && JSON.stringify(valor) !== JSON.stringify(antes[parte])),
  );
  return Object.keys(parcial).length > 0 ? parcial : null;
}
