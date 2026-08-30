import { RESPONSAVEL_NENHUM } from './filtro.js';

/**
 * Edição em massa (flag `crm.massa`, `PATCH /crm/leads/bulk`). O back aplica
 * lead a lead, com as mesmas regras do PUT, e sempre responde 200 com o
 * resultado de cada um — aqui fica a forma do pedido e a leitura da resposta.
 *
 * @typedef {{
 *   status: { ativa: boolean, valor: string },
 *   fonteLead: { ativa: boolean, valor: string },
 *   responsavel: { ativa: boolean, valor: string },
 *   tags: { ativa: boolean, adicionar: string[], remover: string[] },
 * }} FormMassa  `responsavel.valor` = id, `RESPONSAVEL_NENHUM` (tira) ou ''
 * @typedef {{
 *   status?: string,
 *   fonteLead?: string,
 *   usuarioResponsavelId?: string | null,
 *   tags?: { adicionar?: string[], remover?: string[] },
 * }} AlteracoesMassa
 * @typedef {{
 *   id: string,
 *   ok: boolean,
 *   inalterado?: boolean,
 *   erro?: { statusCode: number, code: string, message: string, fields?: Record<string, string[]> },
 * }} ResultadoMassa
 * @typedef {{
 *   total: number,
 *   atualizados: number,
 *   inalterados: number,
 *   falhas: number,
 *   resultados: ResultadoMassa[],
 * }} RespostaMassa
 */

export const MENSAGENS_MASSA = Object.freeze({
  NENHUMA: 'Escolha ao menos uma alteração.',
  SEM_VALOR: 'Escolha um valor.',
  SEM_TAGS: 'Informe ao menos uma tag para somar ou tirar.',
});

/** @type {FormMassa} */
export const FORM_MASSA_VAZIO = Object.freeze({
  status: Object.freeze({ ativa: false, valor: '' }),
  fonteLead: Object.freeze({ ativa: false, valor: '' }),
  responsavel: Object.freeze({ ativa: false, valor: '' }),
  tags: Object.freeze({ ativa: false, adicionar: Object.freeze([]), remover: Object.freeze([]) }),
});

/**
 * Form → corpo `alteracoes`, só com o que está marcado. `erros` por linha
 * (chave do form) e `geral` quando nada foi marcado.
 *
 * @param {FormMassa} form
 * @returns {{ alteracoes: AlteracoesMassa } | { erros: Record<string, string> }}
 */
export function alteracoesDoForm(form) {
  const alteracoes = {};
  const erros = {};

  for (const chave of ['status', 'fonteLead']) {
    const { ativa, valor } = form[chave];
    if (!ativa) {
      continue;
    }
    if (valor) {
      alteracoes[chave] = valor;
    } else {
      erros[chave] = MENSAGENS_MASSA.SEM_VALOR;
    }
  }

  if (form.responsavel.ativa) {
    const { valor } = form.responsavel;
    if (!valor) {
      erros.responsavel = MENSAGENS_MASSA.SEM_VALOR;
    } else {
      alteracoes.usuarioResponsavelId = valor === RESPONSAVEL_NENHUM ? null : valor;
    }
  }

  if (form.tags.ativa) {
    const { adicionar, remover } = form.tags;
    if (adicionar.length === 0 && remover.length === 0) {
      erros.tags = MENSAGENS_MASSA.SEM_TAGS;
    } else {
      alteracoes.tags = {
        ...(adicionar.length > 0 && { adicionar }),
        ...(remover.length > 0 && { remover }),
      };
    }
  }

  if (Object.keys(erros).length > 0) {
    return { erros };
  }
  if (Object.keys(alteracoes).length === 0) {
    return { erros: { geral: MENSAGENS_MASSA.NENHUMA } };
  }

  return { alteracoes };
}

const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

/**
 * "12 atualizados · 3 sem mudança · 2 com erro" — só as partes que existem.
 *
 * @param {RespostaMassa} resposta
 */
export function resumoDoResultado({ atualizados, inalterados, falhas }) {
  const partes = [
    atualizados > 0 && plural(atualizados, 'atualizado', 'atualizados'),
    inalterados > 0 && `${inalterados} sem mudança`,
    falhas > 0 && `${falhas} com erro`,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(' · ') : 'Nenhum lead alterado';
}

/** Aviso breve na lista depois de fechar o dialog (sem toast). */
export function avisoDoResultado({ atualizados }) {
  return atualizados > 0 ? `${plural(atualizados, 'lead atualizado', 'leads atualizados')}.` : null;
}

/**
 * Falhas legíveis: o título do lead e a primeira mensagem de campo (com o
 * rótulo do campo, ex.: "Motivo da perda: é obrigatório…"), senão a mensagem
 * do erro. Lead que saiu da página (404) aparece pelo id curto.
 *
 * @param {ResultadoMassa[]} resultados
 * @param {Map<string, string>} tituloPorId
 * @param {Map<string, string>} rotuloPorChave  `chave` do campo → label
 * @returns {{ id: string, titulo: string, mensagem: string }[]}
 */
export function falhasDoResultado(resultados, tituloPorId, rotuloPorChave) {
  return resultados
    .filter((resultado) => !resultado.ok)
    .map(({ id, erro }) => ({
      id,
      titulo: tituloPorId.get(id) ?? id.slice(0, 8),
      mensagem: mensagemDoErro(erro, rotuloPorChave),
    }));
}

function mensagemDoErro(erro, rotuloPorChave) {
  const [campo, mensagens] =
    Object.entries(erro?.fields ?? {}).find(
      ([, lista]) => Array.isArray(lista) && lista.length > 0,
    ) ?? [];

  if (campo) {
    return `${rotuloPorChave.get(campo) ?? campo}: ${mensagens[0]}`;
  }
  return erro?.message || 'Não foi possível alterar este lead.';
}
