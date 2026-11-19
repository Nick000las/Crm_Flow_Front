import { condicaoParaEnvio, condicaoParaForm } from './condicoes.js';
import { descreverItem, operadoresDoCampo } from './filtro.js';
import { valorDaCondicao } from './regras.js';

/**
 * Alertas do formulário (FM5, `crm.formularios`): "quando o alvo casa com a
 * condição, a pessoa ganha um alerta". O alvo é um item do próprio rascunho,
 * campo do CRM ou pergunta já salva (com `id`). A condição usa o construtor das
 * regras do CRM: os alvos viram "campos" com `id` = `chave` = a `chaveLocal` do
 * item (`campo:<id>`, `pergunta:<id>`). O back confere tudo de novo. Puro.
 *
 * @typedef {'info' | 'warning' | 'critical'} NivelAlerta
 * @typedef {{ campoId: string } | { perguntaId: string }} AlvoDaApi
 * @typedef {{
 *   id?: string, alvo: AlvoDaApi, operador: string, valor?: unknown,
 *   nivel: NivelAlerta, texto: string,
 * }} AlertaDaApi
 * @typedef {{
 *   chaveLocal: string,
 *   id?: string,
 *   condicao: { campoId: string, operador: string, valor: unknown },
 *   nivel: NivelAlerta,
 *   texto: string,
 * }} AlertaNoForm  `condicao.campoId` é a `chaveLocal` do alvo
 * @typedef {{
 *   id: string, chave: string, label: string, tipo: string,
 *   opcoes: string[] | null, opcoesLista: unknown[] | null,
 * }} AlvoDoAlerta  no formato de `Campo` que o construtor de condição usa
 * @typedef {{ campo?: string, operador?: string, valor?: string, nivel?: string, texto?: string }} ErrosDoAlerta
 * @typedef {{
 *   id: string, nivel: NivelAlerta, texto: string, generico: boolean,
 *   formulario: { id: string, nome: string }, respostaId: string,
 *   criadoEm: string, vistoEm: string | null,
 * }} AlertaDaPessoa  `generico`: o papel não vê o alvo; sem link para a resposta
 */

export const NIVEIS_ALERTA = Object.freeze({
  INFO: 'info',
  ATENCAO: 'warning',
  CRITICO: 'critical',
});

const ROTULOS_NIVEL = Object.freeze({
  [NIVEIS_ALERTA.INFO]: 'Informativo',
  [NIVEIS_ALERTA.ATENCAO]: 'Atenção',
  [NIVEIS_ALERTA.CRITICO]: 'Crítico',
});

/** Do mais grave para o mais leve, como o select mostra. */
export const OPCOES_NIVEL = Object.freeze(
  [NIVEIS_ALERTA.CRITICO, NIVEIS_ALERTA.ATENCAO, NIVEIS_ALERTA.INFO].map((nivel) =>
    Object.freeze({ valor: nivel, rotulo: ROTULOS_NIVEL[nivel] }),
  ),
);

export const LIMITES_ALERTA = Object.freeze({ POR_FORMULARIO: 30, TEXTO: 300 });

export const MENSAGENS_ALERTA = Object.freeze({
  ALVO: 'Escolha um campo ou uma pergunta do formulário',
  ALVO_SAIU: 'O item saiu do formulário: escolha outro ou remova o alerta',
  OPERADOR: 'Escolha um operador que valha para este tipo',
  TEXTO: 'Escreva o texto do alerta',
  TEXTO_LONGO: `Use no máximo ${LIMITES_ALERTA.TEXTO} caracteres`,
  LIMITE: `No máximo ${LIMITES_ALERTA.POR_FORMULARIO} alertas por formulário`,
  REVISE: 'Revise os alertas marcados para salvar.',
});

/** @param {string} nivel */
export const rotuloDoNivel = (nivel) => ROTULOS_NIVEL[nivel] ?? nivel;

const PREFIXO_CAMPO = 'campo:';
const PREFIXO_PERGUNTA = 'pergunta:';

/** @param {AlvoDaApi} alvo */
export function chaveDoAlvo(alvo) {
  return 'campoId' in alvo
    ? `${PREFIXO_CAMPO}${alvo.campoId}`
    : `${PREFIXO_PERGUNTA}${alvo.perguntaId}`;
}

/**
 * @param {string} chave
 * @returns {AlvoDaApi | null}
 */
export function alvoDaChave(chave) {
  if (chave.startsWith(PREFIXO_CAMPO)) {
    return { campoId: chave.slice(PREFIXO_CAMPO.length) };
  }
  if (chave.startsWith(PREFIXO_PERGUNTA)) {
    return { perguntaId: chave.slice(PREFIXO_PERGUNTA.length) };
  }
  return null;
}

/**
 * Pergunta como alvo: opções são texto (sem `opcoesLista`).
 *
 * @param {string} chave
 * @param {{ rotulo: string, tipo: string, opcoes?: string[] | null }} pergunta
 * @returns {AlvoDoAlerta}
 */
function alvoDePergunta(chave, pergunta) {
  const opcoes = (pergunta.opcoes ?? []).map((opcao) => opcao.trim()).filter(Boolean);
  return {
    id: chave,
    chave,
    label: pergunta.rotulo.trim() || 'Pergunta sem texto',
    tipo: pergunta.tipo,
    opcoes: opcoes.length > 0 ? opcoes : null,
    opcoesLista: null,
  };
}

/**
 * Campo como alvo, pelo schema (`/fields`): é dele o `opcoesLista`, e o valor de
 * seleção é a `key`. Sem o schema, usa o retrato (`campo` da versão).
 *
 * @param {string} chave
 * @param {{ label: string, tipo: string, opcoes?: string[] | null, opcoesLista?: unknown[] | null }} campo
 * @returns {AlvoDoAlerta}
 */
function alvoDeCampo(chave, campo) {
  return {
    id: chave,
    chave,
    label: campo.label,
    tipo: campo.tipo,
    opcoes: campo.opcoes ?? null,
    opcoesLista: campo.opcoesLista ?? null,
  };
}

/**
 * Os itens do rascunho que podem ser alvo: os campos que o schema conhece e as
 * perguntas já salvas. Pergunta nova (sem `id`) só entra depois de salvar.
 *
 * @param {import('./formularios.js').RascunhoNoForm} rascunho
 * @param {import('../types.js').Campo[]} campos schema (`/fields`)
 * @returns {AlvoDoAlerta[]}
 */
export function alvosDoRascunho(rascunho, campos) {
  const porId = new Map(campos.map((campo) => [campo.id, campo]));

  return rascunho.secoes
    .flatMap((secao) => secao.itens)
    .flatMap((item) => {
      if ('pergunta' in item) {
        return item.pergunta.id
          ? [alvoDePergunta(`${PREFIXO_PERGUNTA}${item.pergunta.id}`, item.pergunta)]
          : [];
      }
      const campo = porId.get(item.campoId);
      return campo ? [alvoDeCampo(`${PREFIXO_CAMPO}${item.campoId}`, campo)] : [];
    });
}

/**
 * Os alvos de uma versão publicada, pelo retrato da versão; o schema completa
 * o `opcoesLista` dos campos, para a seleção sair pelo nome.
 *
 * @param {{ secoes: { itens: object[] }[] }} versao
 * @param {import('../types.js').Campo[]} campos
 * @returns {AlvoDoAlerta[]}
 */
export function alvosDaVersao(versao, campos) {
  const porId = new Map(campos.map((campo) => [campo.id, campo]));

  return versao.secoes
    .flatMap((secao) => secao.itens)
    .map((item) =>
      'pergunta' in item
        ? alvoDePergunta(`${PREFIXO_PERGUNTA}${item.pergunta.id}`, item.pergunta)
        : alvoDeCampo(`${PREFIXO_CAMPO}${item.campoId}`, {
            ...item.campo,
            opcoesLista: porId.get(item.campoId)?.opcoesLista ?? null,
          }),
    );
}

/**
 * @param {AlertaDaApi[] | null | undefined} alertas
 * @param {AlvoDoAlerta[]} alvos
 * @returns {AlertaNoForm[]}
 */
export function alertasDoForm(alertas, alvos) {
  return (alertas ?? []).map((alerta, indice) => ({
    chaveLocal: alerta.id ? `alerta:${alerta.id}` : `alerta-importado-${indice}`,
    ...(alerta.id && { id: alerta.id }),
    condicao: condicaoParaForm(
      { campoId: chaveDoAlvo(alerta.alvo), operador: alerta.operador, valor: alerta.valor },
      alvos,
    ),
    nivel: alerta.nivel,
    texto: alerta.texto ?? '',
  }));
}

/**
 * Sem alvo ainda; o nível começa em "Atenção".
 *
 * @param {number} sequencia
 * @returns {AlertaNoForm}
 */
export function alertaNovo(sequencia) {
  return {
    chaveLocal: `alerta-novo-${sequencia}`,
    condicao: { campoId: '', operador: '', valor: null },
    nivel: NIVEIS_ALERTA.ATENCAO,
    texto: '',
  };
}

/**
 * Alerta do form → item do `PUT`, com o `id` que a API devolveu. O índice é o
 * mesmo do form: todos vão, na ordem, e os erros do back voltam por ele.
 *
 * @param {AlertaNoForm[]} alertas
 * @param {AlvoDoAlerta[]} alvos
 * @returns {AlertaDaApi[]}
 */
export function alertasParaApi(alertas, alvos) {
  return alertas.map((alerta) => {
    const conhecido = alvos.some((alvo) => alvo.id === alerta.condicao.campoId);
    const { operador, valor } = conhecido
      ? condicaoParaEnvio(alerta.condicao, alvos)
      : { operador: alerta.condicao.operador, valor: undefined };

    return {
      ...(alerta.id && { id: alerta.id }),
      alvo: alvoDaChave(alerta.condicao.campoId) ?? { campoId: '' },
      operador,
      ...(valor !== undefined && { valor }),
      nivel: alerta.nivel,
      texto: alerta.texto.trim(),
    };
  });
}

/**
 * O que dá para conferir antes de enviar, com as mesmas regras do back.
 *
 * @param {AlertaNoForm[]} alertas
 * @param {AlvoDoAlerta[]} alvos
 * @returns {{ porAlerta: Record<string, ErrosDoAlerta>, geral: string | null }}
 */
export function validarAlertas(alertas, alvos) {
  const porAlerta = {};

  for (const alerta of alertas) {
    const erros = {};
    const { campoId, operador } = alerta.condicao;
    const alvo = alvos.find((atual) => atual.id === campoId);

    if (!campoId) {
      erros.campo = MENSAGENS_ALERTA.ALVO;
    } else if (!alvo) {
      erros.campo = MENSAGENS_ALERTA.ALVO_SAIU;
    } else if (!operadoresDoCampo(alvo).includes(operador)) {
      erros.operador = MENSAGENS_ALERTA.OPERADOR;
    } else {
      const resultado = valorDaCondicao(alerta.condicao, alvos);
      if ('erro' in resultado) {
        erros.valor = resultado.erro;
      }
    }

    const texto = alerta.texto.trim();
    if (!texto) {
      erros.texto = MENSAGENS_ALERTA.TEXTO;
    } else if (texto.length > LIMITES_ALERTA.TEXTO) {
      erros.texto = MENSAGENS_ALERTA.TEXTO_LONGO;
    }

    if (Object.keys(erros).length > 0) {
      porAlerta[alerta.chaveLocal] = erros;
    }
  }

  let geral = null;
  if (alertas.length > LIMITES_ALERTA.POR_FORMULARIO) {
    geral = MENSAGENS_ALERTA.LIMITE;
  } else if (Object.keys(porAlerta).length > 0) {
    geral = MENSAGENS_ALERTA.REVISE;
  }

  return { porAlerta, geral };
}

/** Parte do caminho do 400 (`rascunho.alertas.<i>.<parte>`) → onde a mensagem aparece. */
const ERRO_DA_PARTE = Object.freeze({
  alvo: 'campo',
  operador: 'operador',
  valor: 'valor',
  nivel: 'nivel',
  texto: 'texto',
});

export const CAMINHO_DO_ALERTA = /^rascunho\.alertas\.(\d+)(?:\.(\w+))?/;

/**
 * Um erro do back num alerta, pelo índice do que foi enviado. `id` repetido
 * (e o que não tem parte) aparece no texto, que está sempre à vista.
 *
 * @param {RegExpExecArray} caminho resultado de `CAMINHO_DO_ALERTA`
 * @param {AlertaNoForm[]} enviados
 * @returns {{ chaveLocal: string, parte: keyof ErrosDoAlerta } | null}
 */
export function destinoDoErroDeAlerta(caminho, enviados) {
  const alerta = enviados[Number(caminho[1])];
  if (!alerta) {
    return null;
  }
  return {
    chaveLocal: alerta.chaveLocal,
    parte: /** @type {keyof ErrosDoAlerta} */ (ERRO_DA_PARTE[caminho[2]] ?? 'texto'),
  };
}

/**
 * "Alergias contém dipirona", a partir do alerta como a API devolve. Alvo
 * desconhecido fica como "Item removido".
 *
 * @param {AlertaDaApi} alerta
 * @param {AlvoDoAlerta[]} alvos
 * @param {Map<string, string>} [nomePorId]
 */
export function descreverAlerta(alerta, alvos, nomePorId) {
  const chave = chaveDoAlvo(alerta.alvo);
  const alvo = alvos.find((atual) => atual.id === chave);
  if (!alvo) {
    return 'Item removido';
  }
  return descreverItem(
    { chave, operador: alerta.operador, valor: alerta.valor },
    alvo,
    nomePorId ?? new Map(),
  );
}
