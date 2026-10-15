import { TIPOS_COM_OPCOES } from '../constants.js';

/**
 * Regras puras da página "Campos": visibilidade da Camada 2 e definições
 * da Camada 3 (campos personalizados).
 *
 * @typedef {{ coluna: string, visivel: boolean, ordem: number, obrigatorio: boolean }} LinhaVisibilidade
 * @typedef {{
 *   id: string,
 *   chave: string,
 *   label: string,
 *   tipo: string,
 *   opcoes: string[] | null,
 *   obrigatorio: boolean,
 *   ordem: number,
 * }} Definicao
 */

export const MENSAGENS_CAMPOS = Object.freeze({
  LABEL: 'Informe o nome do campo',
  OPCOES: 'Informe ao menos uma opção',
  OPCAO_REPETIDA: 'Há opções repetidas',
  ORDEM: 'Informe uma ordem inteira',
});

// ---------------------------------------------------------------------------
// Camada 2: visibilidade

/**
 * Ocultar um campo também tira a obrigatoriedade: obrigatório invisível não
 * tem como ser preenchido (e a UI desabilita o switch nesse estado).
 *
 * @param {LinhaVisibilidade} linha
 * @param {Partial<LinhaVisibilidade>} mudancas
 * @returns {LinhaVisibilidade}
 */
export function alterarVisibilidade(linha, mudancas) {
  const proxima = { ...linha, ...mudancas };

  return proxima.visivel ? proxima : { ...proxima, obrigatorio: false };
}

const mesmaLinha = (a, b) =>
  a.visivel === b.visivel && a.ordem === b.ordem && a.obrigatorio === b.obrigatorio;

/**
 * Só as linhas alteradas vão no `PUT` (ele é parcial).
 *
 * @param {LinhaVisibilidade[]} iniciais
 * @param {LinhaVisibilidade[]} atuais
 */
export function linhasAlteradas(iniciais, atuais) {
  const inicialPorColuna = new Map(iniciais.map((linha) => [linha.coluna, linha]));

  return atuais.filter((linha) => {
    const inicial = inicialPorColuna.get(linha.coluna);
    return !inicial || !mesmaLinha(inicial, linha);
  });
}

/** Ordem digitada → inteiro, ou `null` se inválida. */
export function lerOrdem(texto) {
  const numero = Number(String(texto).trim());

  return String(texto).trim() !== '' && Number.isInteger(numero) ? numero : null;
}

// ---------------------------------------------------------------------------
// Camada 3: ordem das definições

/**
 * Move a definição uma posição (↑ = -1, ↓ = +1) e devolve só o que mudou
 * de ordem — o corpo de `PUT /crm/field-definitions/reorder`.
 *
 * As ordens existentes são reaproveitadas (elas dividem espaço com as
 * Camadas 1/2 na ordenação do form); se houver empate, viram estritamente
 * crescentes para a troca ter efeito.
 *
 * @param {Definicao[]} definicoes já ordenadas por `ordem`
 * @param {string} id
 * @param {-1 | 1} direcao
 * @returns {{ id: string, ordem: number }[]} vazio se não há para onde mover
 */
export function reordenar(definicoes, id, direcao) {
  const origem = definicoes.findIndex((definicao) => definicao.id === id);
  const destino = origem + direcao;
  if (origem < 0 || destino < 0 || destino >= definicoes.length) return [];

  const reordenadas = [...definicoes];
  [reordenadas[origem], reordenadas[destino]] = [reordenadas[destino], reordenadas[origem]];

  const ordensDisponiveis = definicoes.map((definicao) => definicao.ordem).sort((a, b) => a - b);
  let anterior = Number.NEGATIVE_INFINITY;

  return reordenadas
    .map((definicao, indice) => {
      const ordem = Math.max(ordensDisponiveis[indice], anterior + 1);
      anterior = ordem;
      return { id: definicao.id, ordem, mudou: ordem !== definicao.ordem };
    })
    .filter((item) => item.mudou)
    .map(({ id: idDefinicao, ordem }) => ({ id: idDefinicao, ordem }));
}

/**
 * Ordem de um campo novo: depois de tudo que já existe no form.
 *
 * @param {{ ordem: number }[]} campos todos os campos (`/fields`) e definições
 */
export function proximaOrdem(campos) {
  return campos.reduce((maior, campo) => Math.max(maior, campo.ordem ?? 0), 0) + 1;
}

// ---------------------------------------------------------------------------
// Camada 3: form de definição

/** @param {Definicao} [definicao] */
export function valoresDaDefinicao(definicao) {
  return {
    label: definicao?.label ?? '',
    tipo: definicao?.tipo ?? 'texto',
    obrigatorio: definicao?.obrigatorio ?? false,
    opcoes: definicao?.opcoes?.length ? [...definicao.opcoes] : [''],
  };
}

export function usaOpcoes(tipo) {
  return TIPOS_COM_OPCOES.includes(tipo);
}

const opcoesLimpas = (opcoes) => opcoes.map((opcao) => opcao.trim()).filter(Boolean);

/**
 * Validação de UX antes do envio; o back confirma (e gera a `chave`).
 *
 * @returns {Record<string, string>} `{ label?, opcoes? }`
 */
export function validarDefinicao(valores) {
  const erros = {};

  if (!valores.label.trim()) erros.label = MENSAGENS_CAMPOS.LABEL;

  if (usaOpcoes(valores.tipo)) {
    const opcoes = opcoesLimpas(valores.opcoes);
    if (opcoes.length === 0) erros.opcoes = MENSAGENS_CAMPOS.OPCOES;
    else if (new Set(opcoes).size !== opcoes.length) erros.opcoes = MENSAGENS_CAMPOS.OPCAO_REPETIDA;
  }

  return erros;
}

/**
 * Corpo de criação/edição. `opcoes` só vai para tipo de seleção — o back
 * descarta nos demais, mas não há por que mandar.
 */
export function payloadDaDefinicao(valores) {
  const payload = {
    label: valores.label.trim(),
    tipo: valores.tipo,
    obrigatorio: valores.obrigatorio,
  };

  return usaOpcoes(valores.tipo) ? { ...payload, opcoes: opcoesLimpas(valores.opcoes) } : payload;
}
