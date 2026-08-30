/**
 * @file Página pública do formulário (FM3/FM4, `/f/:token`, sem login). Os campos usam os
 * controles do CRM: aqui, o item vira o `Campo` que eles esperam, e os valores vão e voltam no
 * formato da ficha.
 */
import { CAMADA } from '../constants.js';
import { paraValorDeApi, paraValorDeForm } from './form-lead.js';

/**
 * Página pública do formulário (FM3/FM4, `/f/:token`, sem login). Os campos
 * usam os controles do CRM: aqui, o item vira o `Campo` que eles esperam, e os
 * valores vão e voltam no formato da ficha.
 *
 * @typedef {{ label: string, tipo: string, opcoes: string[] | null, opcoesLista?: { key: string, label: string }[] }} RetratoDoCampo
 * @typedef {{
 *   campoId: string, obrigatorio: boolean, campo: RetratoDoCampo, valor: unknown,
 * }} ItemPublicoDeCampo  `valor`: o salvo, quando o dono marcou "vem preenchido"
 * @typedef {{
 *   pergunta: { id: string, rotulo: string, ajuda: string | null, tipo: string, opcoes: string[] | null },
 *   obrigatorio: boolean,
 * }} ItemPublicoDePergunta
 * @typedef {ItemPublicoDeCampo | ItemPublicoDePergunta} ItemPublico
 * @typedef {{
 *   introducao: string | null,
 *   termo: string,
 *   secoes: { titulo: string | null, itens: ItemPublico[] }[],
 * }} VersaoPublica
 * @typedef {'titular' | 'responsavel'} QuemPreenche
 * @typedef {{ aceite: boolean, preenchidoPor: QuemPreenche, nomeResponsavel: string }} Envio
 */

export const QUEM_PREENCHE = Object.freeze({ TITULAR: 'titular', RESPONSAVEL: 'responsavel' });

const STATUS_INDISPONIVEL = 404;
const STATUS_MUITAS_TENTATIVAS = 429;
const PREFIXO_RESPOSTA = 'respostas.';

export const MENSAGENS_PUBLICAS = Object.freeze({
  INDISPONIVEL: 'Este link não está mais disponível. Peça um novo a quem enviou.',
  MUITAS_TENTATIVAS: 'Muitas tentativas. Aguarde um minuto e tente de novo.',
  GENERICA: 'Não foi possível carregar o formulário.',
  OBRIGATORIA: 'Responda esta pergunta',
  ACEITE: 'É preciso aceitar o termo para enviar',
  RESPONSAVEL: 'Informe o nome de quem está preenchendo',
});

/** @param {ItemPublico} item */
export const ehPerguntaPublica = (item) => 'pergunta' in item;

/** A chave do item no corpo do envio e nos erros: `campoId` ou `pergunta.id`. */
export function chaveDoItem(item) {
  return ehPerguntaPublica(item) ? item.pergunta.id : item.campoId;
}

/** @param {VersaoPublica} versao */
const itensDe = (versao) => versao.secoes.flatMap((secao) => secao.itens);

/**
 * O item no formato `Campo` do `CampoDinamico`. Sem `opcoesLista`, a opção já
 * é o texto escrito (como na Camada 3): não passa por `humanizar`.
 *
 * @param {ItemPublico} item
 * @returns {import('../types.js').Campo & { ajuda: string | null }}
 */
export function campoDoItem(item) {
  const dados = ehPerguntaPublica(item)
    ? { label: item.pergunta.rotulo, tipo: item.pergunta.tipo, opcoes: item.pergunta.opcoes }
    : item.campo;

  return {
    chave: chaveDoItem(item),
    label: dados.label,
    tipo: dados.tipo,
    camada: dados.opcoesLista ? CAMADA.CAMADA_2 : CAMADA.CAMADA_3,
    obrigatorio: item.obrigatorio,
    ordem: 0,
    opcoes: dados.opcoes ?? null,
    ...(dados.opcoesLista && { opcoesLista: dados.opcoesLista }),
    ajuda: ehPerguntaPublica(item) ? item.pergunta.ajuda : null,
  };
}

/**
 * O que o form mostra de início: o valor pré-preenchido; a pergunta vem vazia.
 *
 * @param {VersaoPublica} versao
 * @returns {Record<string, unknown>}
 */
export function valoresIniciais(versao) {
  return Object.fromEntries(
    itensDe(versao).map((item) => {
      const { tipo } = campoDoItem(item);
      const valor = ehPerguntaPublica(item) ? null : item.valor;

      return [chaveDoItem(item), paraValorDeForm(tipo, valor)];
    }),
  );
}

/**
 * Corpo do `POST /public/f/:token/respostas`. Campo vazio fica de fora: ele
 * nunca apaga o que a pessoa já tem.
 *
 * @param {VersaoPublica} versao
 * @param {Record<string, unknown>} valores
 * @param {Envio} envio
 */
export function corpoDoEnvio(versao, valores, envio) {
  const respostas = {};

  for (const item of itensDe(versao)) {
    const chave = chaveDoItem(item);
    const valor = paraValorDeApi(campoDoItem(item).tipo, valores[chave]);

    if (valor !== null && valor !== undefined) {
      respostas[chave] = valor;
    }
  }

  const comResponsavel = envio.preenchidoPor === QUEM_PREENCHE.RESPONSAVEL;

  return {
    respostas,
    aceite: envio.aceite,
    preenchidoPor: envio.preenchidoPor,
    ...(comResponsavel && { nomeResponsavel: envio.nomeResponsavel.trim() }),
  };
}

/**
 * Só UX, antes de gastar um envio; quem decide é o back. Número inválido fica
 * para o back responder no campo.
 *
 * @param {VersaoPublica} versao
 * @param {Record<string, unknown>} valores
 * @param {Envio} envio
 * @returns {{ porChave: Record<string, string>, aceite?: string, nomeResponsavel?: string }}
 */
export function validarEnvio(versao, valores, envio) {
  const porChave = {};

  for (const item of itensDe(versao).filter((atual) => atual.obrigatorio)) {
    const chave = chaveDoItem(item);
    const valor = paraValorDeApi(campoDoItem(item).tipo, valores[chave]);

    if (valor === null || valor === undefined) {
      porChave[chave] = MENSAGENS_PUBLICAS.OBRIGATORIA;
    }
  }

  return {
    porChave,
    ...(!envio.aceite && { aceite: MENSAGENS_PUBLICAS.ACEITE }),
    ...(envio.preenchidoPor === QUEM_PREENCHE.RESPONSAVEL &&
      !envio.nomeResponsavel.trim() && { nomeResponsavel: MENSAGENS_PUBLICAS.RESPONSAVEL }),
  };
}

/** @param {ReturnType<typeof validarEnvio>} erros */
export function temErros(erros) {
  return Object.keys(erros.porChave).length > 0 || Boolean(erros.aceite || erros.nomeResponsavel);
}

/**
 * 400 do envio → onde mostrar. O link continua valendo.
 *
 * @param {Record<string, string[]> | null | undefined} fields
 * @returns {ReturnType<typeof validarEnvio> & { outros: string[] }}
 */
export function errosDoEnvio(fields) {
  const erros = { porChave: {}, outros: [] };

  for (const [caminho, mensagens] of Object.entries(fields ?? {})) {
    const mensagem = Array.isArray(mensagens) ? mensagens[0] : String(mensagens);

    if (caminho.startsWith(PREFIXO_RESPOSTA)) {
      erros.porChave[caminho.slice(PREFIXO_RESPOSTA.length)] = mensagem;
    } else if (caminho === 'aceite' || caminho === 'nomeResponsavel') {
      erros[caminho] = mensagem;
    } else {
      erros.outros.push(mensagem);
    }
  }

  return erros;
}

/**
 * A mensagem de um erro que fecha a página. Não diferencia por que o link
 * acabou: a API responde igual para vencido, cancelado e respondido.
 *
 * @param {{ status?: number | null, retryAfter?: number | null } | null | undefined} erro
 * @returns {{ texto: string, tentarDeNovo: boolean } | null} `null` = não fecha a página
 */
export function mensagemDoErroPublico(erro) {
  if (!erro) {
    return null;
  }

  if (erro.status === STATUS_INDISPONIVEL) {
    return { texto: MENSAGENS_PUBLICAS.INDISPONIVEL, tentarDeNovo: false };
  }

  if (erro.status === STATUS_MUITAS_TENTATIVAS) {
    const segundos = Number(erro.retryAfter);
    const texto =
      segundos > 0
        ? `Muitas tentativas. Aguarde ${segundos} segundos e tente de novo.`
        : MENSAGENS_PUBLICAS.MUITAS_TENTATIVAS;

    return { texto, tentarDeNovo: true };
  }

  return { texto: MENSAGENS_PUBLICAS.GENERICA, tentarDeNovo: true };
}
