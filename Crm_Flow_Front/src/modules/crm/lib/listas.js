import { corValida } from '../../../lib/contraste.js';
import { CATEGORIAS_STATUS, TIPOS_LISTA } from '../constants.js';
import { ordenarPorIds } from './ordem.js';

/**
 * Regras de Configurações › Listas. O back valida de novo (400/409); aqui
 * só se evita a ida ao servidor com dado que ele recusaria.
 *
 * @typedef {{
 *   id: string,
 *   key: string,
 *   label: string,
 *   color: string | null,
 *   position: number,
 *   category: string | null,
 *   ativo: boolean,
 *   usos: number,
 * }} OpcaoConfigurada
 *
 * @typedef {Record<string, OpcaoConfigurada[]>} Listas  `GET /crm/configuracoes/listas`, por tipo
 * @typedef {{ label: string, color: string, category: string }} ValoresOpcao  estado do form
 */

export const MENSAGENS_LISTA = Object.freeze({
  NOME: 'Informe o nome da opção',
  COR: 'Use uma cor no formato #RRGGBB',
  CATEGORIA: 'Escolha a categoria',
});

/** Só Status tem categoria (aberto/ganho/perdido). */
export const temCategoria = (tipo) => tipo === TIPOS_LISTA.STATUS;

/**
 * @param {string} tipo
 * @param {OpcaoConfigurada} [opcao] ausente = criando
 * @returns {ValoresOpcao}
 */
export function valoresDaOpcao(tipo, opcao) {
  return {
    label: opcao?.label ?? '',
    color: opcao?.color ?? '',
    category: opcao?.category ?? (temCategoria(tipo) ? CATEGORIAS_STATUS.ABERTO : ''),
  };
}

/** @param {string} tipo @param {ValoresOpcao} valores */
export function validarOpcao(tipo, valores) {
  const erros = {};

  if (!valores.label.trim()) erros.label = MENSAGENS_LISTA.NOME;
  if (valores.color && !corValida(valores.color)) erros.color = MENSAGENS_LISTA.COR;
  if (temCategoria(tipo) && !valores.category) erros.category = MENSAGENS_LISTA.CATEGORIA;

  return erros;
}

/**
 * Corpo do POST (criando) ou do PUT parcial (editando: só o que mudou; cor
 * apagada vira `color: null`). `null` = nada a enviar.
 *
 * @param {string} tipo
 * @param {ValoresOpcao} valores
 * @param {OpcaoConfigurada} [original]
 */
export function payloadDaOpcao(tipo, valores, original) {
  const label = valores.label.trim();
  // `<input type="color">` devolve minúsculas; a cor gravada pode vir em maiúsculas.
  const color = valores.color ? valores.color.toLowerCase() : null;
  const category = temCategoria(tipo) ? valores.category : undefined;

  if (!original) {
    return { label, ...(color && { color }), ...(category && { category }) };
  }

  const mudancas = {
    ...(label !== original.label && { label }),
    ...(color !== (original.color?.toLowerCase() ?? null) && { color }),
    ...(category && category !== original.category && { category }),
  };

  return Object.keys(mudancas).length > 0 ? mudancas : null;
}

/**
 * Por que não dá para excluir — `null` = pode. O back responde 409 do
 * mesmo jeito; o botão já nasce desabilitado com a explicação.
 *
 * @param {OpcaoConfigurada} opcao
 */
export function motivoNaoExclui(opcao) {
  if (opcao.usos <= 0) return null;

  const leads = opcao.usos === 1 ? '1 lead' : `${opcao.usos.toLocaleString('pt-BR')} leads`;
  return `Em uso por ${leads}. Desative em vez de excluir.`;
}

// ---------------------------------------------------------------------------
// Cache de `GET /crm/configuracoes/listas`

/** @param {Listas} listas @param {string} tipo @param {OpcaoConfigurada} atualizada */
export function substituirOpcao(listas, tipo, atualizada) {
  return { ...listas, [tipo]: listas[tipo].map((opcao) => (opcao.id === atualizada.id ? atualizada : opcao)) };
}

/** @param {Listas} listas @param {string} tipo @param {OpcaoConfigurada} nova */
export function adicionarOpcao(listas, tipo, nova) {
  return { ...listas, [tipo]: [...(listas[tipo] ?? []), nova] };
}

/** @param {Listas} listas @param {string} tipo @param {string} id */
export function removerOpcao(listas, tipo, id) {
  return { ...listas, [tipo]: listas[tipo].filter((opcao) => opcao.id !== id) };
}

/** @param {Listas} listas @param {string} tipo @param {string[]} ids */
export function reordenarLista(listas, tipo, ids) {
  return { ...listas, [tipo]: ordenarPorIds(listas[tipo], ids) };
}
