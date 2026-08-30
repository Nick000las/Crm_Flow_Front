/**
 * @file 400/409 do `PUT` ou do publicar → onde mostrar. Os índices são os de `secoesEnviadas`
 * do rascunho que foi enviado; o item guarda a primeira mensagem de cada parte (`campoId`,
 * `preencher`, `pergunta.*`).
 */
import { ROTULOS_TIPO, TIPOS_CAMPO } from '../constants.js';
import {
  alertasDoForm,
  alertasParaApi,
  alvosDoRascunho,
  CAMINHO_DO_ALERTA,
  destinoDoErroDeAlerta,
  validarAlertas,
} from './alertas-formulario.js';
import { moverPara } from './ordem.js';

/**
 * Formulários (FM1/FM2b, `crm.formularios`): seções com dois tipos de item, um
 * campo do CRM (a resposta grava na pessoa) ou uma pergunta própria (a resposta
 * fica só no formulário). O rascunho é editado aqui e vai inteiro no `PUT`;
 * publicar grava uma versão imutável. O back valida tudo de novo.
 *
 * @typedef {'overwrite' | 'fill_if_empty'} Politica
 * @typedef {{
 *   id: string, chave: string, label: string, tipo: string, camada: number,
 *   sensivel: boolean, opcoes: string[] | null, politicaPadrao: Politica,
 *   podePreencher?: boolean,
 * }} CampoElegivel  `podePreencher: false` = sensível: não vem preenchido
 * @typedef {{
 *   id?: string, rotulo: string, ajuda: string | null, tipo: string,
 *   opcoes?: string[] | null, sensivel: boolean,
 * }} PerguntaDaApi  sem `id` = nova; o back gera
 * @typedef {{ campoId: string, obrigatorio: boolean, politica: Politica, preencher?: boolean }} ItemDeCampoDaApi
 * @typedef {{ pergunta: PerguntaDaApi, obrigatorio: boolean }} ItemDePerguntaDaApi
 * @typedef {{ titulo: string | null, itens: (ItemDeCampoDaApi | ItemDePerguntaDaApi)[] }} SecaoDaApi
 * @typedef {{
 *   secoes: SecaoDaApi[], introducao: string | null, termo: string | null,
 *   alertas?: import('./alertas-formulario.js').AlertaDaApi[],
 * }} RascunhoDaApi
 * @typedef {{
 *   id: string, nome: string, descricao: string | null, ativo: boolean, validadeDias: number,
 *   versaoAtual: { id: string, versao: number, publicadaEm: string } | null,
 *   alteracoesNaoPublicadas: boolean, atualizadoEm: string,
 * }} ResumoDoFormulario
 * @typedef {ResumoDoFormulario & {
 *   rascunho: RascunhoDaApi,
 *   versoes: { id: string, versao: number, publicadaEm: string, publicadaPor: string | null }[],
 * }} DetalheDoFormulario
 * @typedef {{ id?: string, rotulo: string, ajuda: string, tipo: string, opcoes: string[], sensivel: boolean }} PerguntaNoForm
 * @typedef {{
 *   chaveLocal: string, campoId: string, obrigatorio: boolean, politica: Politica, preencher: boolean,
 * }} ItemDeCampo
 * @typedef {{ chaveLocal: string, pergunta: PerguntaNoForm, obrigatorio: boolean }} ItemDePergunta
 * @typedef {ItemDeCampo | ItemDePergunta} ItemDoFormulario  `chaveLocal` é o id do arraste e dos erros
 * @typedef {{ chaveLocal: string, titulo: string, itens: ItemDoFormulario[] }} SecaoNoForm
 * @typedef {{
 *   secoes: SecaoNoForm[], introducao: string, termo: string, sequencia: number,
 *   alertas: import('./alertas-formulario.js').AlertaNoForm[],
 * }} RascunhoNoForm  `sequencia` gera as chaves locais novas (seção, pergunta, alerta)
 * @typedef {{ nome: string, descricao: string, validadeDias: string, ativo: boolean }} DadosNoForm
 * @typedef {{ campo?: string, preencher?: string, pergunta?: string, item?: string }} ErrosDoItem
 * @typedef {{
 *   dados: Record<string, string>,
 *   porItem: Record<string, ErrosDoItem>,
 *   porSecao: Record<string, string>,
 *   secoes: string | null,
 *   introducao: string | null,
 *   termo: string | null,
 *   porAlerta: Record<string, import('./alertas-formulario.js').ErrosDoAlerta>,
 *   alertas: string | null,
 *   outros: string[],
 * }} ErrosDoFormulario  `porItem`, `porSecao` e `porAlerta` por `chaveLocal`
 */

export const POLITICAS = Object.freeze({
  SOBRESCREVER: 'overwrite',
  PREENCHER_SE_VAZIO: 'fill_if_empty',
});

export const OPCOES_POLITICA = Object.freeze([
  Object.freeze({ valor: POLITICAS.SOBRESCREVER, rotulo: 'Substituir o valor salvo' }),
  Object.freeze({ valor: POLITICAS.PREENCHER_SE_VAZIO, rotulo: 'Só preencher se estiver vazio' }),
]);

/** Os tipos do CRM, menos usuário (quem responde não conhece a equipe) e endereço. */
export const TIPOS_PERGUNTA = Object.freeze(
  Object.values(TIPOS_CAMPO).filter(
    (tipo) => tipo !== TIPOS_CAMPO.USUARIO && tipo !== TIPOS_CAMPO.ENDERECO,
  ),
);

export const OPCOES_TIPO_PERGUNTA = Object.freeze(
  TIPOS_PERGUNTA.map((tipo) => Object.freeze({ valor: tipo, rotulo: ROTULOS_TIPO[tipo] ?? tipo })),
);

export const TIPOS_COM_OPCOES = Object.freeze([TIPOS_CAMPO.SELECAO, TIPOS_CAMPO.SELECAO_MULTIPLA]);

export const LIMITES_PERGUNTA = Object.freeze({ ROTULO: 200, AJUDA: 500, OPCOES: 50, OPCAO: 120 });

export const LIMITE_FORMULARIOS = 50;

export const VALIDADE = Object.freeze({ MINIMO: 1, MAXIMO: 90, PADRAO: 7 });

export const MENSAGENS_FORMULARIO = Object.freeze({
  NOME: 'Informe o nome do formulário',
  VALIDADE: `Informe de ${VALIDADE.MINIMO} a ${VALIDADE.MAXIMO} dias`,
  INDISPONIVEIS: 'Tire os campos indisponíveis para salvar.',
  REVISE_ITENS: 'Revise os itens marcados para salvar.',
  LIMITE: `O limite é de ${LIMITE_FORMULARIOS} formulários por empresa.`,
  SEM_PREENCHER: 'Campo sensível: um link encaminhado mostraria esse dado.',
  DESLIGUE_PREENCHER: 'O campo agora é sensível: desligue "Vem preenchido" para salvar.',
  ROTULO: 'Escreva a pergunta',
  ROTULO_LONGO: `Use no máximo ${LIMITES_PERGUNTA.ROTULO} caracteres`,
  AJUDA_LONGA: `Use no máximo ${LIMITES_PERGUNTA.AJUDA} caracteres`,
  SEM_OPCOES: 'Escreva ao menos uma opção',
  MUITAS_OPCOES: `No máximo ${LIMITES_PERGUNTA.OPCOES} opções`,
  OPCAO_LONGA: `Cada opção tem no máximo ${LIMITES_PERGUNTA.OPCAO} caracteres`,
  OPCAO_REPETIDA: 'Há opções repetidas',
});

const DADOS_DO_PUT = new Set(['nome', 'descricao', 'validadeDias', 'ativo']);
const CAMINHO_DO_ITEM = /^rascunho\.secoes\.(\d+)\.itens\.(\d+)(?:\.(\w+))?/;
const CAMINHO_DA_SECAO = /^rascunho\.secoes\.(\d+)(?:\.\w+)?$/;
/** Parte do caminho do item → onde a mensagem aparece. */
const ERRO_DA_PARTE = Object.freeze({
  campoId: 'campo',
  preencher: 'preencher',
  pergunta: 'pergunta',
});

const textoOuNulo = (texto) => (texto ?? '').trim() || null;
const chaveDaSecao = (indice) => `secao-${indice}`;
const temOpcoes = (tipo) => TIPOS_COM_OPCOES.includes(tipo);

/** @param {ItemDoFormulario | ItemDeCampoDaApi | ItemDePerguntaDaApi} item */
export const ehPergunta = (item) => 'pergunta' in item;

/**
 * O nome do item na tela, nos anúncios do arraste e nos rótulos de acessibilidade.
 *
 * @param {ItemDoFormulario} item
 * @param {Map<string, CampoElegivel>} campoPorId
 */
export function rotuloDoItem(item, campoPorId) {
  return ehPergunta(item)
    ? item.pergunta.rotulo.trim() || 'Pergunta sem texto'
    : (campoPorId.get(item.campoId)?.label ?? 'Campo indisponível');
}

/**
 * "Rascunho", "Publicado" ou "Publicado com alterações".
 *
 * @param {ResumoDoFormulario} formulario
 * @returns {{ rotulo: string, versao: number | null }}
 */
export function situacaoDoFormulario({ versaoAtual, alteracoesNaoPublicadas }) {
  if (!versaoAtual) {
    return { rotulo: 'Rascunho', versao: null };
  }

  return {
    rotulo: alteracoesNaoPublicadas ? 'Publicado com alterações' : 'Publicado',
    versao: versaoAtual.versao,
  };
}

/** @param {ResumoDoFormulario} formulario @returns {DadosNoForm} */
export function dadosDoForm(formulario) {
  return {
    nome: formulario.nome,
    descricao: formulario.descricao ?? '',
    validadeDias: String(formulario.validadeDias),
    ativo: formulario.ativo,
  };
}

/** @param {DadosNoForm} dados */
export function dadosParaApi(dados) {
  return {
    nome: dados.nome.trim(),
    descricao: textoOuNulo(dados.descricao),
    validadeDias: Number(dados.validadeDias),
    ativo: dados.ativo,
  };
}

/** @returns {PerguntaNoForm} */
export function perguntaVazia() {
  return { rotulo: '', ajuda: '', tipo: TIPOS_CAMPO.TEXTO, opcoes: [''], sensivel: false };
}

/**
 * @param {ItemDeCampoDaApi | ItemDePerguntaDaApi} item
 * @param {string} chaveNova para pergunta sem `id`
 * @returns {ItemDoFormulario}
 */
function itemDoForm(item, chaveNova) {
  if (ehPergunta(item)) {
    const { pergunta } = /** @type {ItemDePerguntaDaApi} */ (item);

    return {
      chaveLocal: pergunta.id ? `pergunta:${pergunta.id}` : chaveNova,
      obrigatorio: item.obrigatorio ?? false,
      pergunta: {
        ...(pergunta.id && { id: pergunta.id }),
        rotulo: pergunta.rotulo,
        ajuda: pergunta.ajuda ?? '',
        tipo: pergunta.tipo,
        opcoes: pergunta.opcoes?.length ? [...pergunta.opcoes] : [''],
        sensivel: pergunta.sensivel ?? false,
      },
    };
  }

  const { campoId, obrigatorio, politica, preencher } = /** @type {ItemDeCampoDaApi} */ (item);

  return {
    chaveLocal: `campo:${campoId}`,
    campoId,
    obrigatorio: obrigatorio ?? false,
    politica,
    preencher: preencher ?? false,
  };
}

/**
 * Sem seção, o form começa com uma vazia, para já dar onde pôr o primeiro item.
 * A pergunta vem com o `id` do back, que volta em toda edição. Os alertas
 * (FM5) precisam do schema (`campos`) para o valor ir para o formato do form.
 *
 * @param {RascunhoDaApi | null | undefined} rascunho
 * @param {import('../types.js').Campo[]} [campos] schema (`/fields`)
 * @returns {RascunhoNoForm}
 */
export function rascunhoDoForm(rascunho, campos = []) {
  let novas = 0;
  const secoes = (rascunho?.secoes ?? []).map((secao, indice) => ({
    chaveLocal: chaveDaSecao(indice),
    titulo: secao.titulo ?? '',
    itens: secao.itens.map((item) => itemDoForm(item, `importada-${(novas += 1)}`)),
  }));
  const comUma =
    secoes.length > 0 ? secoes : [{ chaveLocal: chaveDaSecao(0), titulo: '', itens: [] }];

  const alvos = alvosDoRascunho({ secoes: comUma }, campos);

  return {
    secoes: comUma,
    introducao: rascunho?.introducao ?? '',
    termo: rascunho?.termo ?? '',
    alertas: alertasDoForm(rascunho?.alertas, alvos),
    sequencia: comUma.length,
  };
}

/**
 * As seções que vão no `PUT`: a vazia e sem título não diz nada e fica de fora.
 * Os índices dos erros do back são desta lista.
 *
 * @param {RascunhoNoForm} rascunho
 */
export function secoesEnviadas(rascunho) {
  return rascunho.secoes.filter((secao) => secao.itens.length > 0 || secao.titulo.trim());
}

/**
 * Opções só nos tipos de seleção: em outro tipo, o back dá 400.
 *
 * @param {PerguntaNoForm} pergunta
 * @returns {PerguntaDaApi}
 */
export function perguntaParaApi(pergunta) {
  return {
    ...(pergunta.id && { id: pergunta.id }),
    rotulo: pergunta.rotulo.trim(),
    ajuda: textoOuNulo(pergunta.ajuda),
    tipo: pergunta.tipo,
    ...(temOpcoes(pergunta.tipo) && {
      opcoes: pergunta.opcoes.map((opcao) => opcao.trim()).filter(Boolean),
    }),
    sensivel: pergunta.sensivel,
  };
}

/** @param {ItemDoFormulario} item */
function itemParaApi(item) {
  if (ehPergunta(item)) {
    return { pergunta: perguntaParaApi(item.pergunta), obrigatorio: item.obrigatorio };
  }

  const { campoId, obrigatorio, politica, preencher } = item;

  return { campoId, obrigatorio, politica, preencher };
}

/**
 * Os alertas vão todos, na ordem do form: os índices dos erros são os dele.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {import('../types.js').Campo[]} [campos] schema (`/fields`)
 * @returns {RascunhoDaApi}
 */
export function rascunhoParaApi(rascunho, campos = []) {
  return {
    secoes: secoesEnviadas(rascunho).map((secao) => ({
      titulo: textoOuNulo(secao.titulo),
      itens: secao.itens.map(itemParaApi),
    })),
    introducao: textoOuNulo(rascunho.introducao),
    termo: textoOuNulo(rascunho.termo),
    alertas: alertasParaApi(rascunho.alertas ?? [], alvosDoRascunho(rascunho, campos)),
  };
}

/**
 * Corpo do `PUT /crm/configuracoes/formularios/:id`. Vai sempre inteiro.
 *
 * @param {DadosNoForm} dados
 * @param {RascunhoNoForm} rascunho
 * @param {import('../types.js').Campo[]} [campos] schema (`/fields`)
 */
export function corpoDoPut(dados, rascunho, campos = []) {
  return { ...dadosParaApi(dados), rascunho: rascunhoParaApi(rascunho, campos) };
}

/**
 * @param {ReturnType<typeof corpoDoPut>} inicial
 * @param {ReturnType<typeof corpoDoPut>} atual
 */
export function formularioMudou(inicial, atual) {
  return JSON.stringify(inicial) !== JSON.stringify(atual);
}

/** @param {RascunhoNoForm} rascunho */
export function adicionarSecao(rascunho) {
  return {
    ...rascunho,
    secoes: [
      ...rascunho.secoes,
      { chaveLocal: `secao-${rascunho.sequencia}`, titulo: '', itens: [] },
    ],
    sequencia: rascunho.sequencia + 1,
  };
}

/**
 * Os campos da seção voltam para os disponíveis. Sobra sempre uma seção.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveLocal
 */
export function removerSecao(rascunho, chaveLocal) {
  const secoes = rascunho.secoes.filter((secao) => secao.chaveLocal !== chaveLocal);

  return secoes.length > 0 ? { ...rascunho, secoes } : adicionarSecao({ ...rascunho, secoes });
}

/** @param {RascunhoNoForm} rascunho @param {string} chaveLocal @param {string} titulo */
export function renomearSecao(rascunho, chaveLocal, titulo) {
  return {
    ...rascunho,
    secoes: rascunho.secoes.map((secao) =>
      secao.chaveLocal === chaveLocal ? { ...secao, titulo } : secao,
    ),
  };
}

/** @param {RascunhoNoForm} rascunho @param {number} de @param {number} para */
export function moverSecao(rascunho, de, para) {
  return { ...rascunho, secoes: moverPara(rascunho.secoes, de, para) };
}

/**
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveSecao
 * @param {ItemDoFormulario} item
 */
function noFimDaSecao(rascunho, chaveSecao, item) {
  return {
    ...rascunho,
    secoes: rascunho.secoes.map((secao) =>
      secao.chaveLocal === chaveSecao ? { ...secao, itens: [...secao.itens, item] } : secao,
    ),
  };
}

/**
 * Campo no fim da seção, com a política padrão, sem ser obrigatório e sem vir
 * preenchido.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveSecao
 * @param {CampoElegivel} campo
 */
export function adicionarItem(rascunho, chaveSecao, campo) {
  return noFimDaSecao(rascunho, chaveSecao, {
    chaveLocal: `campo:${campo.id}`,
    campoId: campo.id,
    obrigatorio: false,
    politica: campo.politicaPadrao,
    preencher: false,
  });
}

/**
 * Pergunta nova, sem `id`: o back gera um no `PUT`.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveSecao
 * @param {PerguntaNoForm} pergunta
 */
export function adicionarPergunta(rascunho, chaveSecao, pergunta) {
  const comChave = { ...rascunho, sequencia: rascunho.sequencia + 1 };

  return noFimDaSecao(comChave, chaveSecao, {
    chaveLocal: `nova-${rascunho.sequencia}`,
    obrigatorio: false,
    pergunta,
  });
}

/**
 * Mantém o `id`: é ele que liga as respostas entre versões.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveLocal
 * @param {PerguntaNoForm} pergunta
 */
export function editarPergunta(rascunho, chaveLocal, pergunta) {
  return alterarItem(rascunho, chaveLocal, { pergunta });
}

/** @param {RascunhoNoForm} rascunho @param {string} chaveLocal */
export function removerItem(rascunho, chaveLocal) {
  return {
    ...rascunho,
    secoes: rascunho.secoes.map((secao) => ({
      ...secao,
      itens: secao.itens.filter((item) => item.chaveLocal !== chaveLocal),
    })),
  };
}

/**
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveLocal
 * @param {Record<string, unknown>} mudancas
 */
export function alterarItem(rascunho, chaveLocal, mudancas) {
  return {
    ...rascunho,
    secoes: rascunho.secoes.map((secao) => ({
      ...secao,
      itens: secao.itens.map((item) =>
        item.chaveLocal === chaveLocal ? { ...item, ...mudancas } : item,
      ),
    })),
  };
}

/**
 * Onde o item está: seção e posição.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveLocal
 * @returns {{ secao: string, indice: number } | null}
 */
export function posicaoDoItem(rascunho, chaveLocal) {
  for (const secao of rascunho.secoes) {
    const indice = secao.itens.findIndex((item) => item.chaveLocal === chaveLocal);

    if (indice >= 0) {
      return { secao: secao.chaveLocal, indice };
    }
  }

  return null;
}

/**
 * Dentro da seção ou para outra. `indice` é a posição final na seção de
 * destino, como no `arrayMove` do dnd-kit; além do fim, vai para o fim.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {string} chaveLocal
 * @param {{ secao: string, indice: number }} destino
 */
export function moverItem(rascunho, chaveLocal, destino) {
  const origem = posicaoDoItem(rascunho, chaveLocal);

  if (!origem || (origem.secao === destino.secao && origem.indice === destino.indice)) {
    return rascunho;
  }

  const item = rascunho.secoes
    .find((secao) => secao.chaveLocal === origem.secao)
    .itens.find((atual) => atual.chaveLocal === chaveLocal);
  const semOItem = removerItem(rascunho, chaveLocal);

  return {
    ...semOItem,
    secoes: semOItem.secoes.map((secao) => {
      if (secao.chaveLocal !== destino.secao) {
        return secao;
      }

      const itens = [...secao.itens];

      itens.splice(Math.min(Math.max(destino.indice, 0), itens.length), 0, item);

      return { ...secao, itens };
    }),
  };
}

/** @param {RascunhoNoForm} rascunho @returns {ItemDeCampo[]} */
const itensDeCampo = (rascunho) =>
  /** @type {ItemDeCampo[]} */ (
    rascunho.secoes.flatMap((secao) => secao.itens).filter((item) => !ehPergunta(item))
  );

/**
 * Os campos que ainda não entraram no formulário.
 *
 * @param {CampoElegivel[]} elegiveis
 * @param {RascunhoNoForm} rascunho
 */
export function camposDisponiveis(elegiveis, rascunho) {
  const usados = new Set(itensDeCampo(rascunho).map((item) => item.campoId));

  return elegiveis.filter((campo) => !usados.has(campo.id));
}

/**
 * Itens de campo desligado ou que deixou de ser elegível (`chaveLocal`). O
 * back recusa o `PUT` inteiro com um deles, então a tela pede para tirar antes.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {CampoElegivel[]} elegiveis
 * @returns {Set<string>}
 */
export function itensIndisponiveis(rascunho, elegiveis) {
  const ids = new Set(elegiveis.map((campo) => campo.id));

  return new Set(
    itensDeCampo(rascunho)
      .filter((item) => !ids.has(item.campoId))
      .map((item) => item.chaveLocal),
  );
}

/**
 * Item que vem preenchido, mas o campo não pode (virou sensível): o back
 * recusa o `PUT` e a publicação.
 *
 * @param {RascunhoNoForm} rascunho
 * @param {CampoElegivel[]} elegiveis
 * @returns {Set<string>} `chaveLocal`
 */
export function preenchidosProibidos(rascunho, elegiveis) {
  const porId = new Map(elegiveis.map((campo) => [campo.id, campo]));

  return new Set(
    itensDeCampo(rascunho)
      .filter((item) => item.preencher && porId.get(item.campoId)?.podePreencher === false)
      .map((item) => item.chaveLocal),
  );
}

/**
 * O que o back recusaria na pergunta, com os mesmos limites.
 *
 * @param {PerguntaNoForm} pergunta
 * @returns {{ rotulo?: string, ajuda?: string, opcoes?: string }}
 */
export function validarPergunta(pergunta) {
  const erros = {};
  const rotulo = pergunta.rotulo.trim();

  if (!rotulo) {
    erros.rotulo = MENSAGENS_FORMULARIO.ROTULO;
  } else if (rotulo.length > LIMITES_PERGUNTA.ROTULO) {
    erros.rotulo = MENSAGENS_FORMULARIO.ROTULO_LONGO;
  }

  if (pergunta.ajuda.trim().length > LIMITES_PERGUNTA.AJUDA) {
    erros.ajuda = MENSAGENS_FORMULARIO.AJUDA_LONGA;
  }

  if (temOpcoes(pergunta.tipo)) {
    const opcoes = pergunta.opcoes.map((opcao) => opcao.trim()).filter(Boolean);
    const normalizadas = opcoes.map((opcao) => opcao.toLocaleLowerCase('pt-BR'));

    if (opcoes.length === 0) {
      erros.opcoes = MENSAGENS_FORMULARIO.SEM_OPCOES;
    } else if (opcoes.length > LIMITES_PERGUNTA.OPCOES) {
      erros.opcoes = MENSAGENS_FORMULARIO.MUITAS_OPCOES;
    } else if (opcoes.some((opcao) => opcao.length > LIMITES_PERGUNTA.OPCAO)) {
      erros.opcoes = MENSAGENS_FORMULARIO.OPCAO_LONGA;
    } else if (new Set(normalizadas).size !== normalizadas.length) {
      erros.opcoes = MENSAGENS_FORMULARIO.OPCAO_REPETIDA;
    }
  }

  return erros;
}

/**
 * O que dá para conferir antes de enviar.
 *
 * @param {DadosNoForm} dados
 * @param {RascunhoNoForm} rascunho
 * @param {CampoElegivel[]} elegiveis
 * @param {import('../types.js').Campo[]} [campos] schema (`/fields`), para os alertas
 * @returns {{
 *   dados: Record<string, string>,
 *   porItem: Record<string, ErrosDoItem>,
 *   porAlerta: Record<string, import('./alertas-formulario.js').ErrosDoAlerta>,
 *   geral: string | null,
 * }}
 */
export function validarNoCliente(dados, rascunho, elegiveis, campos = []) {
  const erros = {};

  if (!dados.nome.trim()) {
    erros.nome = MENSAGENS_FORMULARIO.NOME;
  }

  const validade = Number(dados.validadeDias);

  if (
    !dados.validadeDias.trim() ||
    !Number.isInteger(validade) ||
    validade < VALIDADE.MINIMO ||
    validade > VALIDADE.MAXIMO
  ) {
    erros.validadeDias = MENSAGENS_FORMULARIO.VALIDADE;
  }

  const porItem = {};

  for (const chave of preenchidosProibidos(rascunho, elegiveis)) {
    porItem[chave] = { preencher: MENSAGENS_FORMULARIO.DESLIGUE_PREENCHER };
  }

  for (const item of rascunho.secoes.flatMap((secao) => secao.itens)) {
    const daPergunta = ehPergunta(item) ? Object.values(validarPergunta(item.pergunta))[0] : null;

    if (daPergunta) {
      porItem[item.chaveLocal] = { pergunta: daPergunta };
    }
  }

  const alertas = validarAlertas(rascunho.alertas ?? [], alvosDoRascunho(rascunho, campos));

  let geral = alertas.geral;

  if (itensIndisponiveis(rascunho, elegiveis).size > 0) {
    geral = MENSAGENS_FORMULARIO.INDISPONIVEIS;
  } else if (Object.keys(porItem).length > 0) {
    geral = MENSAGENS_FORMULARIO.REVISE_ITENS;
  }

  return { dados: erros, porItem, porAlerta: alertas.porAlerta, geral };
}

/**
 * 400/409 do `PUT` ou do publicar → onde mostrar. Os índices são os de
 * `secoesEnviadas` do rascunho que foi enviado; o item guarda a primeira
 * mensagem de cada parte (`campoId`, `preencher`, `pergunta.*`).
 *
 * @param {Record<string, string[]> | null | undefined} fields
 * @param {RascunhoNoForm} enviado
 * @returns {ErrosDoFormulario}
 */
export function errosDoFormulario(fields, enviado) {
  const secoes = secoesEnviadas(enviado);
  /** @type {ErrosDoFormulario} */
  const erros = {
    dados: {},
    porItem: {},
    porSecao: {},
    secoes: null,
    introducao: null,
    termo: null,
    porAlerta: {},
    alertas: null,
    outros: [],
  };

  for (const [caminho, mensagens] of Object.entries(fields ?? {})) {
    const mensagem = Array.isArray(mensagens) ? mensagens[0] : String(mensagens);
    const doAlerta = CAMINHO_DO_ALERTA.exec(caminho);
    const destino = doAlerta && destinoDoErroDeAlerta(doAlerta, enviado.alertas ?? []);

    if (destino) {
      const doMesmo = erros.porAlerta[destino.chaveLocal] ?? {};

      erros.porAlerta[destino.chaveLocal] = { [destino.parte]: mensagem, ...doMesmo };
      continue;
    }

    if (caminho === 'rascunho.alertas') {
      erros.alertas = mensagem;
      continue;
    }

    const doItem = CAMINHO_DO_ITEM.exec(caminho);
    const daSecao = CAMINHO_DA_SECAO.exec(caminho);
    const item = doItem && secoes[Number(doItem[1])]?.itens[Number(doItem[2])];
    const secao = daSecao && secoes[Number(daSecao[1])];

    if (DADOS_DO_PUT.has(caminho)) {
      erros.dados[caminho] = mensagem;
    } else if (item) {
      const parte = ERRO_DA_PARTE[doItem[3]] ?? 'item';
      const doMesmo = erros.porItem[item.chaveLocal] ?? {};

      erros.porItem[item.chaveLocal] = { [parte]: mensagem, ...doMesmo };
    } else if (secao) {
      erros.porSecao[secao.chaveLocal] = mensagem;
    } else if (caminho === 'rascunho.secoes') {
      erros.secoes = mensagem;
    } else if (caminho === 'rascunho.introducao' || caminho === 'rascunho.termo') {
      erros[caminho.slice('rascunho.'.length)] = mensagem;
    } else {
      erros.outros.push(mensagem);
    }
  }

  return erros;
}
