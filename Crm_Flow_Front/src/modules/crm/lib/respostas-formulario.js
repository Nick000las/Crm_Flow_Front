/**
 * Respostas de formulário na ficha (FM4): o que a pessoa declarou e o que a
 * resposta fez em cada campo do CRM. A pergunta própria não tem `escrita`:
 * a resposta dela fica só no formulário.
 *
 * @typedef {{ resultado: 'gravado' | 'ignorado' | 'revisao', motivo: string | null }} EscritaDoItem
 * @typedef {{ gravados: number, ignorados: number, revisao: number }} ResumoDaEscrita
 * @typedef {{
 *   id: string,
 *   formulario: { id: string, nome: string },
 *   versao: { id: string, versao: number },
 *   linkId: string,
 *   oportunidadeId: string | null,
 *   preenchidoPor: 'titular' | 'responsavel',
 *   nomeResponsavel: string | null,
 *   respondidoEm: string,
 *   escrita: ResumoDaEscrita,
 * }} RespostaResumo
 * @typedef {{
 *   campoId: string,
 *   campo: { label: string, tipo: string, opcoes: string[] | null, opcoesLista?: { key: string, label: string }[] },
 *   valor?: unknown,
 *   oculto?: true,
 *   escrita: EscritaDoItem | null,
 * }} ItemRespondidoDeCampo  `oculto`: sem `valor`, mostrar "Restrito"
 * @typedef {{
 *   pergunta: { id: string, rotulo: string, tipo: string, opcoes: string[] | null },
 *   valor?: unknown,
 *   oculto?: true,
 * }} ItemRespondidoDePergunta
 * @typedef {RespostaResumo & {
 *   termo: string,
 *   aceitoEm: string,
 *   secoes: { titulo: string | null, itens: (ItemRespondidoDeCampo | ItemRespondidoDePergunta)[] }[],
 *   origem?: { ip: string | null, navegador: string | null },
 * }} RespostaDetalhe  `origem` só para a gestão
 */

export const RESULTADOS_ESCRITA = Object.freeze({
  GRAVADO: 'gravado',
  IGNORADO: 'ignorado',
  REVISAO: 'revisao',
});

const TEXTO_POR_MOTIVO = Object.freeze({
  igual: 'Igual ao que já estava',
  sem_resposta: 'Não respondido',
  valor_diferente: 'A pessoa informou um valor diferente do que está salvo',
  contato_de_outra_pessoa: 'Este contato já é de outra pessoa',
  regra_do_crm: 'Uma regra do CRM impediu a gravação (ex.: campo obrigatório)',
  campo_indisponivel: 'O campo foi desligado depois da publicação',
});

const TEXTO_POR_RESULTADO = Object.freeze({
  [RESULTADOS_ESCRITA.GRAVADO]: 'Atualizado na ficha',
  [RESULTADOS_ESCRITA.IGNORADO]: 'Não gravado',
  [RESULTADOS_ESCRITA.REVISAO]: 'Para revisar',
});

/**
 * @param {EscritaDoItem | null | undefined} escrita
 * @returns {string | null}
 */
export function textoDaEscrita(escrita) {
  if (!escrita) {
    return null;
  }
  if (escrita.resultado === RESULTADOS_ESCRITA.GRAVADO) {
    return TEXTO_POR_RESULTADO.gravado;
  }
  return TEXTO_POR_MOTIVO[escrita.motivo] ?? TEXTO_POR_RESULTADO[escrita.resultado] ?? null;
}

/**
 * "Usar este valor" só quando a pessoa declarou outro valor e ele está à vista.
 *
 * @param {ItemRespondidoDeCampo | ItemRespondidoDePergunta} item
 */
export function podeUsarValor(item) {
  return (
    'campoId' in item &&
    !item.oculto &&
    item.escrita?.resultado === RESULTADOS_ESCRITA.REVISAO &&
    item.escrita.motivo === 'valor_diferente'
  );
}

/** @param {Pick<RespostaResumo, 'escrita'>} resposta */
export function precisaRevisar(resposta) {
  return (resposta.escrita?.revisao ?? 0) > 0;
}

/** @param {Pick<RespostaResumo, 'preenchidoPor' | 'nomeResponsavel'>} resposta */
export function rotuloDeQuemPreencheu({ preenchidoPor, nomeResponsavel }) {
  if (preenchidoPor === 'responsavel') {
    return nomeResponsavel ? `Responsável: ${nomeResponsavel}` : 'Responsável';
  }
  return 'A própria pessoa';
}

/**
 * "2 atualizados · 1 para revisar", sem o que é zero.
 *
 * @param {ResumoDaEscrita | null | undefined} escrita
 */
export function resumoDaEscrita(escrita) {
  if (!escrita) {
    return null;
  }
  const partes = [
    escrita.gravados > 0 &&
      `${escrita.gravados} ${escrita.gravados === 1 ? 'atualizado' : 'atualizados'}`,
    escrita.ignorados > 0 && `${escrita.ignorados} sem mudança`,
    escrita.revisao > 0 && `${escrita.revisao} para revisar`,
  ].filter(Boolean);
  return partes.length > 0 ? partes.join(' · ') : null;
}
