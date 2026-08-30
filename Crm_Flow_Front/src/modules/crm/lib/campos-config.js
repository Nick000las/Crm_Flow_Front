import { TIPOS_COM_OPCOES } from '../constants.js';

/**
 * Regras puras do form de campo personalizado (Camada 3), usado em
 * Configurações › Campos. Matriz, nome e ordem ficam em `configuracoes-campos.js`.
 *
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
});

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

  if (!valores.label.trim()) {
    erros.label = MENSAGENS_CAMPOS.LABEL;
  }

  if (usaOpcoes(valores.tipo)) {
    const opcoes = opcoesLimpas(valores.opcoes);
    if (opcoes.length === 0) {
      erros.opcoes = MENSAGENS_CAMPOS.OPCOES;
    } else if (new Set(opcoes).size !== opcoes.length) {
      erros.opcoes = MENSAGENS_CAMPOS.OPCAO_REPETIDA;
    }
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
