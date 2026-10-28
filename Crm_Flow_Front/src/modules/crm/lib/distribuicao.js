import { DISTRIBUICAO, TIPOS_DESTINO } from '../constants.js';
import { condicaoParaEnvio, condicaoParaForm, validarCondicoes } from './condicoes.js';
import { errosPorItem } from './erros-de-lista.js';

export { descreverCondicoes } from './condicoes.js';

/**
 * Distribuição automática (`crm.distribuicao`): regras "quando o lead casa
 * com as condições, vai para o usuário ou o grupo". A tela edita um
 * rascunho e o PUT leva a configuração inteira — a ordem do array é a ordem
 * de avaliação. Puro.
 *
 * @typedef {import('../api/distribuicao.api.js').ConfigDistribuicao} ConfigDistribuicao
 * @typedef {import('../api/distribuicao.api.js').RegraDistribuicao} RegraDistribuicao
 * @typedef {import('../api/distribuicao.api.js').GrupoDistribuicao} GrupoDistribuicao
 * @typedef {import('./condicoes.js').CondicaoNoForm} CondicaoNoForm
 * @typedef {{
 *   chaveLocal: string,
 *   id: string | null,
 *   nome: string,
 *   ativo: boolean,
 *   condicoes: CondicaoNoForm[],
 *   destino: string,
 * }} RegraNoForm  `destino`: `usuario:<id>` / `grupo:<id>` (valor do select); `id` nulo = regra nova
 * @typedef {{ ativo: boolean, fallback: string, regras: RegraNoForm[] }} ValoresDistribuicao
 */

export const MENSAGENS_DISTRIBUICAO = Object.freeze({
  NOME: 'Dê um nome à regra',
  DESTINO: 'Escolha o usuário ou o grupo de destino',
  MAX_CONDICOES: `Use no máximo ${DISTRIBUICAO.MAX_CONDICOES} condições`,
  MAX_REGRAS: `Use no máximo ${DISTRIBUICAO.MAX_REGRAS} regras`,
  NOME_GRUPO: 'Dê um nome ao grupo',
});

const SEPARADOR_DESTINO = ':';

/** `{ tipo, id }` → valor do select. */
export function destinoParaSelect(destino) {
  return destino?.tipo && destino?.id ? `${destino.tipo}${SEPARADOR_DESTINO}${destino.id}` : '';
}

/** Valor do select → `{ tipo, id }`, ou `null` sem escolha. */
export function destinoDoSelect(valor) {
  const posicao = String(valor ?? '').indexOf(SEPARADOR_DESTINO);
  if (posicao < 0) return null;
  const tipo = valor.slice(0, posicao);
  const id = valor.slice(posicao + 1);
  return Object.values(TIPOS_DESTINO).includes(tipo) && id ? { tipo, id } : null;
}

/**
 * @param {RegraDistribuicao} regra
 * @param {import('../types.js').Campo[]} campos
 * @returns {RegraNoForm}
 */
export function regraParaForm(regra, campos) {
  return {
    chaveLocal: regra.id,
    id: regra.id,
    nome: regra.nome,
    ativo: regra.ativo,
    condicoes: regra.condicoes.map((condicao) => condicaoParaForm(condicao, campos)),
    destino: destinoParaSelect(regra.destino),
  };
}

/** Regra nova no rascunho (sem `id`: o back cria). @returns {RegraNoForm} */
export function novaRegra(chaveLocal) {
  return { chaveLocal, id: null, nome: '', ativo: true, condicoes: [], destino: '' };
}

/**
 * @param {ConfigDistribuicao} config
 * @param {import('../types.js').Campo[]} campos
 * @returns {ValoresDistribuicao}
 */
export function valoresDaDistribuicao(config, campos) {
  return {
    ativo: config.ativo,
    fallback: config.fallback,
    regras: config.regras.map((regra) => regraParaForm(regra, campos)),
  };
}

/**
 * Erros de uma regra, por caminho relativo a ela (`nome`, `destino`,
 * `condicoes`, `condicoes.<i>`) — o mesmo do 400 do back, sem o `regras.<n>.`.
 *
 * @param {RegraNoForm} regra
 * @param {import('../types.js').Campo[]} campos
 * @returns {Record<string, string>}
 */
export function validarRegraDistribuicao(regra, campos) {
  const erros = {};
  if (!regra.nome.trim()) erros.nome = MENSAGENS_DISTRIBUICAO.NOME;
  if (!destinoDoSelect(regra.destino)) erros.destino = MENSAGENS_DISTRIBUICAO.DESTINO;

  return { ...erros, ...validarCondicoes(regra.condicoes, campos, DISTRIBUICAO.MAX_CONDICOES) };
}

/** Regra do rascunho → item do PUT. Chame depois de `validarRegraDistribuicao`. */
function regraParaEnvio(regra, campos) {
  return {
    ...(regra.id && { id: regra.id }),
    nome: regra.nome.trim(),
    ativo: regra.ativo,
    condicoes: regra.condicoes.map((condicao) => condicaoParaEnvio(condicao, campos)),
    destino: destinoDoSelect(regra.destino),
  };
}

/**
 * Corpo do PUT, ou os erros por regra (`chaveLocal` → erros da regra).
 *
 * @param {ValoresDistribuicao} valores
 * @param {import('../types.js').Campo[]} campos
 * @returns {{ corpo: { ativo: boolean, fallback: string, regras: object[] } }
 *   | { erros: Record<string, Record<string, string>>, geral?: string }}
 */
export function distribuicaoParaEnvio(valores, campos) {
  if (valores.regras.length > DISTRIBUICAO.MAX_REGRAS) return { erros: {}, geral: MENSAGENS_DISTRIBUICAO.MAX_REGRAS };

  const erros = {};
  for (const regra of valores.regras) {
    const daRegra = validarRegraDistribuicao(regra, campos);
    if (Object.keys(daRegra).length > 0) erros[regra.chaveLocal] = daRegra;
  }
  if (Object.keys(erros).length > 0) return { erros };

  return {
    corpo: {
      ativo: valores.ativo,
      fallback: valores.fallback,
      regras: valores.regras.map((regra) => regraParaEnvio(regra, campos)),
    },
  };
}

/**
 * 400 do PUT → erros por regra (`errosPorItem`). Erro da regra inteira
 * (`regras.<n>`) fica em `regra`.
 *
 * @param {Record<string, string[]> | null | undefined} fields
 * @param {string[]} chavesEnviadas `chaveLocal` na ordem do PUT
 * @returns {{ porRegra: Record<string, Record<string, string>>, outros: string[] }}
 */
export function errosDoPut(fields, chavesEnviadas) {
  const { porItem, outros } = errosPorItem(fields, 'regras', chavesEnviadas);
  const porRegra = Object.fromEntries(
    Object.entries(porItem).map(([chave, { item, ...resto }]) => [chave, item ? { ...resto, regra: item } : resto]),
  );
  return { porRegra, outros };
}

/** Uma regra cabe? (`DISTRIBUICAO.MAX_REGRAS`) */
export function podeAdicionarRegra(valores) {
  return valores.regras.length < DISTRIBUICAO.MAX_REGRAS;
}

const semChaveLocal = ({ ativo, fallback, regras }) => ({
  ativo,
  fallback,
  regras: regras.map((regra) => {
    const resto = { ...regra };
    delete resto.chaveLocal;
    return resto;
  }),
});

/**
 * Algo mudou em relação ao salvo?
 *
 * @param {ValoresDistribuicao} valores
 * @param {ConfigDistribuicao} config
 * @param {import('../types.js').Campo[]} campos
 */
export function distribuicaoMudou(valores, config, campos) {
  return (
    JSON.stringify(semChaveLocal(valores)) !== JSON.stringify(semChaveLocal(valoresDaDistribuicao(config, campos)))
  );
}

/**
 * Chave que remonta o form quando a configuração salva muda — só regras,
 * `ativo` e `fallback`. Os grupos ficam fora: criar um grupo não pode
 * descartar o rascunho das regras.
 *
 * @param {ConfigDistribuicao} config
 */
export function chaveDaConfig({ ativo, fallback, regras }) {
  return JSON.stringify({ ativo, fallback, regras });
}

/**
 * Nome do destino para a lista: o usuário (`nomePorId`) ou "Grupo X".
 *
 * @param {string} destino valor do select
 * @param {Map<string, string>} nomePorId
 * @param {GrupoDistribuicao[]} grupos
 */
export function nomeDoDestino(destino, nomePorId, grupos) {
  const escolhido = destinoDoSelect(destino);
  if (!escolhido) return 'Sem destino';
  if (escolhido.tipo === TIPOS_DESTINO.GRUPO) {
    const grupo = grupos.find((atual) => atual.id === escolhido.id);
    return grupo ? `Grupo ${grupo.nome}` : 'Grupo removido';
  }
  return nomePorId.get(escolhido.id) ?? 'Usuário inativo';
}
