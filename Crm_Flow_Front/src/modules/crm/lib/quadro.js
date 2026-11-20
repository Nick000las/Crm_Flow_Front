import { CAMADA, CHAVE_VALOR, TIPOS_CAMPO } from '../constants.js';
import {
  CHAVE_RESPONSAVEL,
  ehCampoComercial,
  idNoForm,
  paraValorDeApi,
  podeEditarCampo,
} from './form-lead.js';
import { formatarMoeda } from './formatadores.js';
import { textoDoValor } from './layout.js';

/**
 * Quadro comercial (M3): regras de tela. Mover, criar e validar são do back,
 * que usa os mesmos services da ficha.
 *
 * @typedef {import('../api/quadro.api.js').CardQuadro} CardQuadro
 * @typedef {import('../api/quadro.api.js').ColunaQuadro} ColunaQuadro
 * @typedef {import('../api/quadro.api.js').PaginaDeCards} PaginaDeCards
 * @typedef {import('../types.js').Campo} Campo
 * @typedef {{ pages: PaginaDeCards[], pageParams: unknown[] }} PaginasDaColuna
 * @typedef {{
 *   noMover: Campo[],
 *   daOportunidade: Campo[],
 *   doLead: Campo[],
 *   bloqueados: string[],
 * }} Obrigatorios  `noMover`: vão em `campos` do próprio mover; `bloqueados`:
 *   mensagens do que este papel não preenche
 */

export const CODIGO_CAMPOS_OBRIGATORIOS = 'CAMPOS_OBRIGATORIOS';

/**
 * Gravam junto com o status, em `campos` do mover. A probabilidade (FC1) não
 * pode ir antes pela oportunidade: a mudança de status a apagaria, e o mover
 * falharia de novo.
 */
const CHAVES_NO_MOVER = new Set(['motivoPerda', 'probabilidadeFechamento']);
/** Todos os personalizados chegam nesta chave, com o nome do campo na mensagem. */
const CHAVE_PERSONALIZADOS = 'customFields';
/** O responsável não está em `/fields`, mas a regra de campo pode exigi-lo. */
const CAMPO_RESPONSAVEL = Object.freeze({
  chave: CHAVE_RESPONSAVEL,
  label: 'Responsável',
  tipo: TIPOS_CAMPO.USUARIO,
  camada: CAMADA.CAMADA_2,
});
/** O que vai por `PUT /crm/oportunidades/:id`, entre os campos de `/fields`. */
const CHAVES_DA_OPORTUNIDADE = new Set([CHAVE_VALOR, 'dataPrevistaFechamento']);
/** Na pessoa nova do quadro, o status é a coluna, e a conversão é do back. */
const FORA_DA_PESSOA_NOVA = new Set(['status', 'dataConversao']);

/**
 * Os cards da coluna, sem repetir: um card inserido por aviso pode voltar no
 * "Carregar mais".
 *
 * @param {PaginasDaColuna | undefined} dados
 * @returns {CardQuadro[]}
 */
export function cardsDasPaginas(dados) {
  const vistos = new Set();
  return (dados?.pages ?? [])
    .flatMap((pagina) => pagina.itens)
    .filter((card) => !vistos.has(card.entidadeId) && vistos.add(card.entidadeId));
}

/**
 * @param {PaginasDaColuna | undefined} dados
 * @param {string} entidadeId
 * @returns {PaginasDaColuna | undefined}
 */
export function tirarDasPaginas(dados, entidadeId) {
  if (!dados) {
    return dados;
  }
  return {
    ...dados,
    pages: dados.pages.map((pagina) => ({
      ...pagina,
      itens: pagina.itens.filter((card) => card.entidadeId !== entidadeId),
    })),
  };
}

/**
 * No topo, que é o lugar dele na ordem padrão; em outra ordem, a recarga o põe
 * no lugar. Coluna que ainda não carregou fica como está.
 *
 * @param {PaginasDaColuna | undefined} dados
 * @param {CardQuadro} card
 * @returns {PaginasDaColuna | undefined}
 */
export function porNoTopo(dados, card) {
  if (!dados || dados.pages.length === 0) {
    return dados;
  }
  const [primeira, ...resto] = dados.pages;
  return { ...dados, pages: [{ ...primeira, itens: [card, ...primeira.itens] }, ...resto] };
}

/**
 * Para onde o card pode ir: status desativado não é destino.
 *
 * @param {ColunaQuadro[]} colunas
 * @param {string} colunaRef
 */
export function colunasDeDestino(colunas, colunaRef) {
  return colunas.filter((coluna) => coluna.ativa && coluna.ref !== colunaRef);
}

/**
 * Texto de um item do card. As opções e o usuário são resolvidos como no resto
 * do CRM; o status o back já manda pelo nome, do pipeline certo.
 *
 * @param {import('../api/quadro.api.js').ItemDoCard} item
 * @param {Campo[]} campos
 * @param {Map<string, string>} nomePorId
 * @returns {string | null}
 */
export function textoDoCard(item, campos, nomePorId) {
  if (item.chave === 'status') {
    return item.valor ? String(item.valor) : null;
  }
  const campo = campos.find((atual) => atual.chave === item.chave);
  return textoDoValor({ ...campo, ...item }, item.valor, nomePorId);
}

/**
 * `null` para quem não vê Valor: nunca "R$ 0,00".
 *
 * @param {import('../api/quadro.api.js').ResumoDaColuna | undefined} resumo
 * @returns {string | null}
 */
export function somaDoResumo(resumo) {
  return formatarMoeda(resumo?.soma);
}

/**
 * Campos do form de pessoa nova.
 *
 * @template {{ chave: string, camada?: number }} T
 * @param {T[]} campos
 * @returns {T[]}
 */
export function camposDaPessoaNova(campos) {
  return campos.filter(
    (campo) => campo.camada === CAMADA.CAMADA_3 || !FORA_DA_PESSOA_NOVA.has(campo.chave),
  );
}

/**
 * Cada recusa de `fields`, com o campo que a resolve (`undefined` = oculto).
 *
 * @param {string} chave
 * @param {string[] | undefined} mensagens
 * @param {Campo[]} campos
 * @returns {{ campo: Campo | undefined, mensagem: string }[]}
 */
function recusasDaChave(chave, mensagens, campos) {
  if (chave === CHAVE_PERSONALIZADOS) {
    return (mensagens ?? []).map((mensagem) => ({
      mensagem,
      campo: campos.find(
        (atual) => atual.camada === CAMADA.CAMADA_3 && mensagem.startsWith(`"${atual.label}"`),
      ),
    }));
  }
  const campo =
    chave === CHAVE_RESPONSAVEL
      ? /** @type {Campo} */ (CAMPO_RESPONSAVEL)
      : campos.find((atual) => atual.chave === chave);
  return [{ campo, mensagem: mensagens?.[0] ?? chave }];
}

/**
 * Reparte o `fields` de `CAMPOS_OBRIGATORIOS`. A regra de campo avalia a pessoa
 * inteira, então a recusa pode citar um dado de contato, que só
 * `PUT /crm/leads/:id` aceita. Motivo e probabilidade vão junto do status, e o
 * resto do comercial vai pela oportunidade: pelo lead, gravaria na principal,
 * que pode ser outra.
 *
 * @param {Record<string, string[]> | undefined} fields
 * @param {Campo[]} campos todos os de `/fields`, com a permissão do papel
 * @returns {Obrigatorios}
 */
export function separarObrigatorios(fields, campos) {
  /** @type {Obrigatorios} */
  const resultado = { noMover: [], daOportunidade: [], doLead: [], bloqueados: [] };

  const recusas = Object.entries(fields ?? {}).flatMap(([chave, mensagens]) =>
    recusasDaChave(chave, mensagens, campos),
  );

  for (const { campo, mensagem } of recusas) {
    const sistema = campo?.camada !== CAMADA.CAMADA_3;

    if (!campo || !podeEditarCampo(campo)) {
      resultado.bloqueados.push(mensagem);
    } else if (sistema && CHAVES_NO_MOVER.has(campo.chave)) {
      resultado.noMover.push(campo);
    } else if (sistema && CHAVES_DA_OPORTUNIDADE.has(campo.chave)) {
      resultado.daOportunidade.push(campo);
    } else if (sistema && ehCampoComercial(campo.chave)) {
      // Status e conversão seguem a coluna: não há o que preencher aqui.
      resultado.bloqueados.push(mensagem);
    } else {
      resultado.doLead.push(campo);
    }
  }

  return resultado;
}

/**
 * `campos` do mover: os valores do form, no formato da API. `undefined` = nada
 * a mandar.
 *
 * @param {Campo[]} noMover
 * @param {Record<string, unknown>} valores do form, por `idNoForm`
 * @returns {Record<string, unknown> | undefined}
 */
export function camposDoMover(noMover, valores) {
  if (noMover.length === 0) {
    return undefined;
  }
  return Object.fromEntries(
    noMover.map((campo) => [campo.chave, paraValorDeApi(campo.tipo, valores[idNoForm(campo)])]),
  );
}

/**
 * O form deixou de cobrir a recusa? Então ele remonta com o que falta.
 *
 * @param {Record<string, string[]> | undefined} fields
 * @param {Set<string>} chavesDoForm
 */
export function pedeOutrosCampos(fields, chavesDoForm) {
  return Object.keys(fields ?? {}).some((chave) => !chavesDoForm.has(chave));
}
