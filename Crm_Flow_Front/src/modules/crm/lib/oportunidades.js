import { CAMADA, CATEGORIAS_STATUS, CHAVE_VALOR, TIPOS_CAMPO } from '../constants.js';
import {
  CHAVE_RESPONSAVEL,
  MENSAGENS,
  erroComercial,
  paraValorDeApi,
  paraValorDeForm,
  podeEditarCampo,
} from './form-lead.js';

/**
 * Aba Oportunidades (M2.5): ponte entre a oportunidade lida, o form e o
 * payload, e o que cada campo permite ao papel. O back valida de verdade.
 *
 * @typedef {import('../api/oportunidades.api.js').Oportunidade} Oportunidade
 * @typedef {import('../types.js').Campo} Campo
 * @typedef {{
 *   pipelineId: string,
 *   status: string,
 *   titulo: string,
 *   valor: string,
 *   probabilidadeFechamento: string,
 *   dataPrevistaFechamento: string,
 *   responsavelId: string,
 * }} ValoresOportunidade
 */

const CHAVE_STATUS = 'status';
const CHAVE_MOTIVO = 'motivoPerda';
const CHAVE_PROBABILIDADE = 'probabilidadeFechamento';
const CHAVE_DATA_PREVISTA = 'dataPrevistaFechamento';

/** Cada dado do form: o tipo, e o campo de `/fields` que controla o acesso. */
const DADOS = Object.freeze([
  { chave: 'titulo', tipo: TIPOS_CAMPO.TEXTO },
  { chave: CHAVE_VALOR, tipo: TIPOS_CAMPO.MONETARIO, campo: CHAVE_VALOR },
  { chave: CHAVE_PROBABILIDADE, tipo: TIPOS_CAMPO.NUMERO, campo: CHAVE_PROBABILIDADE },
  { chave: CHAVE_DATA_PREVISTA, tipo: TIPOS_CAMPO.DATA, campo: CHAVE_DATA_PREVISTA },
  { chave: 'responsavelId', tipo: TIPOS_CAMPO.TEXTO, campo: CHAVE_RESPONSAVEL, semFields: true },
]);

const campoDoSistema = (campos, chave) =>
  campos.find((campo) => campo.chave === chave && campo.camada !== CAMADA.CAMADA_3);

/**
 * Sem o campo em `/fields`, o dado está desligado ou oculto. `semFields`: o
 * responsável não precisa vir lá, e aí vale como editável.
 *
 * @param {Campo[]} campos
 * @param {{ campo?: string, semFields?: boolean }} dado
 * @returns {{ visivel: boolean, editavel: boolean }}
 */
function acessoAoDado(campos, { campo: chave, semFields = false }) {
  if (!chave) {
    return { visivel: true, editavel: true };
  }

  const campo = campoDoSistema(campos, chave);
  if (!campo) {
    return { visivel: semFields, editavel: semFields };
  }
  return { visivel: true, editavel: podeEditarCampo(campo) };
}

/**
 * Quem pode ver e editar cada dado do form.
 *
 * @param {Campo[]} campos os de `/fields`, com a permissão do papel
 * @returns {Record<string, { visivel: boolean, editavel: boolean }>}
 */
export function acessoAosDados(campos) {
  return Object.fromEntries(DADOS.map((dado) => [dado.chave, acessoAoDado(campos, dado)]));
}

/** @param {Campo[]} campos */
export const podeMudarStatus = (campos) => {
  const campo = campoDoSistema(campos, CHAVE_STATUS);
  return Boolean(campo) && podeEditarCampo(campo);
};

/**
 * O campo Motivo da perda, ou `null` se o papel não o vê.
 *
 * @param {Campo[]} campos
 */
export const campoDoMotivo = (campos) => campoDoSistema(campos, CHAVE_MOTIVO) ?? null;

/**
 * @param {Oportunidade | null | undefined} oportunidade ausente = criando
 * @param {{ pipelineId?: string, responsavelId?: string | null }} [padroes]
 * @returns {ValoresOportunidade}
 */
export function valoresDaOportunidade(oportunidade, padroes = {}) {
  const base = oportunidade ?? {};

  return {
    pipelineId: base.pipelineId ?? padroes.pipelineId ?? '',
    status: base.status ?? '',
    titulo: paraValorDeForm(TIPOS_CAMPO.TEXTO, base.titulo),
    valor: paraValorDeForm(TIPOS_CAMPO.MONETARIO, base.valor),
    probabilidadeFechamento: paraValorDeForm(TIPOS_CAMPO.NUMERO, base.probabilidadeFechamento),
    dataPrevistaFechamento: paraValorDeForm(TIPOS_CAMPO.DATA, base.dataPrevistaFechamento),
    responsavelId: oportunidade ? (base.responsavelId ?? '') : (padroes.responsavelId ?? ''),
  };
}

/** @param {Campo[]} campos */
const dadosEditaveis = (campos) => DADOS.filter((dado) => acessoAoDado(campos, dado).editavel);

/**
 * Validação de UX: `{ chave: mensagem }`.
 *
 * @param {ValoresOportunidade} valores
 */
export function validarOportunidade(valores) {
  const erros = {};

  for (const { chave, tipo } of DADOS) {
    const valor = paraValorDeApi(tipo, valores[chave]);
    const erro = Number.isNaN(valor) ? MENSAGENS.NUMERO_INVALIDO : erroComercial(chave, valor);
    if (erro) {
      erros[chave] = erro;
    }
  }

  return erros;
}

/**
 * Só o que foi preenchido e o papel pode enviar: campo "só ver" no payload,
 * mesmo vazio, é 403.
 *
 * @param {ValoresOportunidade} valores
 * @param {Campo[]} campos
 */
export function payloadDaCriacao(valores, campos) {
  const payload = {};

  if (valores.pipelineId) {
    payload.pipelineId = valores.pipelineId;
  }
  if (valores.status) {
    payload.status = valores.status;
  }
  for (const { chave, tipo } of dadosEditaveis(campos)) {
    const valor = paraValorDeApi(tipo, valores[chave]);
    if (valor !== null) {
      payload[chave] = valor;
    }
  }

  return payload;
}

/**
 * Diff contra a oportunidade lida: omitir mantém, `null` limpa. `null` sem
 * mudança nenhuma, porque não há o que enviar.
 *
 * @param {Oportunidade} oportunidade
 * @param {ValoresOportunidade} valores
 * @param {Campo[]} campos
 */
export function payloadDaEdicao(oportunidade, valores, campos) {
  const iniciais = valoresDaOportunidade(oportunidade);
  const mudancas = {};

  for (const { chave, tipo } of dadosEditaveis(campos)) {
    const antes = paraValorDeApi(tipo, iniciais[chave]);
    const depois = paraValorDeApi(tipo, valores[chave]);
    if (antes !== depois) {
      mudancas[chave] = depois;
    }
  }

  return Object.keys(mudancas).length > 0
    ? { ...mudancas, expectedUpdatedAt: oportunidade.atualizadaEm }
    : null;
}

/**
 * Corpo do `PATCH`: o motivo só vale em status perdido.
 *
 * @param {Oportunidade} oportunidade
 * @param {{ status: string, motivoPerda: string }} valores
 * @param {string | null | undefined} categoria do status escolhido
 */
export function payloadDoStatus(oportunidade, { status, motivoPerda }, categoria) {
  return {
    status,
    expectedUpdatedAt: oportunidade.atualizadaEm,
    ...(pedeMotivo(categoria) && motivoPerda ? { motivoPerda } : {}),
  };
}

/** @param {string | null | undefined} categoria */
export const pedeMotivo = (categoria) => categoria === CATEGORIAS_STATUS.PERDIDO;

/**
 * Arquivada ou de lead anonimizado: o back dá 409 em qualquer alteração.
 *
 * @param {Oportunidade} oportunidade
 * @param {{ anonimizado_em?: string | null }} lead
 */
export const podeAlterar = (oportunidade, lead) =>
  !oportunidade.arquivadaEm && !lead.anonimizado_em;

/**
 * O estado atual que o 409 do `PUT` devolve, ou `null` se o erro é outro.
 *
 * @param {unknown} erro
 * @returns {Oportunidade | null}
 */
export const versaoDoConflito = (erro) => erro?.details?.atual ?? null;

/**
 * Separa os `fields` do erro: os que têm campo no dialog e os demais, que
 * `CAMPOS_OBRIGATORIOS` pode trazer (a regra pede um dado do lead) e precisam
 * aparecer em texto, porque o alerta geral não os mostra.
 *
 * @param {unknown} erro
 * @param {readonly string[]} chaves as que o dialog mostra
 * @returns {{ porCampo: Record<string, string>, outros: string[] }}
 */
export function errosDoDialog(erro, chaves) {
  const porCampo = {};
  const outros = [];

  for (const [chave, mensagens] of Object.entries(erro?.fields ?? {})) {
    const mensagem = mensagens?.[0];
    if (mensagem && chaves.includes(chave)) {
      porCampo[chave] = mensagem;
    } else if (mensagem) {
      outros.push(mensagem);
    }
  }

  return { porCampo, outros };
}
