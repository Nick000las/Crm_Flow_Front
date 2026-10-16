import { CONTEXTO } from '../constants.js';

/**
 * Regras da subseção Configurações › Campos. O back valida tudo de novo
 * (400 em `fields.visibilidade/obrigatorio/label`); isto só desabilita antes
 * o que ele recusaria, com o motivo para o usuário.
 *
 * @typedef {import('../types.js').CampoConfigurado} CampoConfigurado
 * @typedef {import('../types.js').Contexto} Contexto
 */

export const CONTEXTOS = Object.freeze(Object.values(CONTEXTO));

export const MOTIVOS = Object.freeze({
  ESSENCIAL: 'Campo essencial: aparece em todas as telas.',
  OBRIGATORIO_NA_CRIACAO: 'Campo obrigatório precisa aparecer no formulário de criação.',
  OBRIGATORIEDADE_FIXA: 'A obrigatoriedade deste campo é fixa.',
  LIGUE_CRIACAO: 'Ligue "Criação" antes de tornar o campo obrigatório.',
  NAO_RENOMEIA: 'Este campo não pode ser renomeado.',
});

/**
 * O que está travado em um campo, e por quê (`null` = livre).
 *
 * @param {CampoConfigurado} campo
 * @returns {{
 *   visibilidade: Record<Contexto, string | null>,
 *   obrigatorio: string | null,
 *   renomear: string | null,
 * }}
 */
export function bloqueios(campo) {
  const { capacidades, obrigatorio, visibilidade } = campo;

  const motivoDoContexto = (contexto) => {
    if (!capacidades.canHide) return MOTIVOS.ESSENCIAL;
    if (contexto === CONTEXTO.CRIACAO && obrigatorio) return MOTIVOS.OBRIGATORIO_NA_CRIACAO;
    return null;
  };

  let motivoObrigatorio = null;
  if (!capacidades.canMakeOptional) motivoObrigatorio = MOTIVOS.OBRIGATORIEDADE_FIXA;
  else if (!obrigatorio && !visibilidade[CONTEXTO.CRIACAO]) motivoObrigatorio = MOTIVOS.LIGUE_CRIACAO;

  return {
    visibilidade: Object.fromEntries(CONTEXTOS.map((contexto) => [contexto, motivoDoContexto(contexto)])),
    obrigatorio: motivoObrigatorio,
    renomear: capacidades.canRename ? null : MOTIVOS.NAO_RENOMEIA,
  };
}

/** Corpo parcial do `PUT /crm/configuracoes/campos/:id` para um checkbox da matriz. */
export function parcialDeVisibilidade(contexto, ligado) {
  return { visibilidade: { [contexto]: ligado } };
}

/**
 * Corpo do renomear, ou `null` se não há o que enviar. Digitar o nome padrão
 * de um campo do sistema é o mesmo que restaurá-lo (`label: null`).
 *
 * @param {CampoConfigurado} campo
 * @param {string} texto
 * @returns {{ label: string | null } | null}
 */
export function parcialDoNome(campo, texto) {
  const label = texto.trim();
  if (label === campo.label) return null;
  if (campo.labelPadrao && label === campo.labelPadrao) return { label: null };

  return { label };
}

/**
 * Lista com um campo trocado pela versão que o back devolveu.
 *
 * @param {CampoConfigurado[]} lista
 * @param {CampoConfigurado} atualizado
 */
export function substituirCampo(lista, atualizado) {
  return lista.map((campo) => (campo.id === atualizado.id ? atualizado : campo));
}
