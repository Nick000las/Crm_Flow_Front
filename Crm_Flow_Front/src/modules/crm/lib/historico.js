import { ORIGEM_DISTRIBUICAO, TIPOS_EVENTO } from '../constants.js';
import { formatarCnpj } from './formatadores.js';
import { textoDoValor } from './layout.js';

/**
 * Timeline do lead: um título por evento ("Criado por Ana", "Arquivado") e
 * o diff como lista ("Status: Novo → Ganho"). Rótulo, tipo e opções de
 * cada item do diff vêm do schema na leitura: renomear um campo não
 * reescreve o histórico, e o texto sai igual ao da tabela.
 *
 * @typedef {import('../api/atividades.api.js').EventoLead} EventoLead
 * @typedef {import('../api/atividades.api.js').ItemDiff} ItemDiff
 */

const AUTOR_SISTEMA = 'Sistema';
const USUARIO_REMOVIDO = 'Usuário removido';
const MAX_VALOR = 80;

/** Título dos eventos que não trazem o autor (ele vai na linha de meta). */
const TITULO_DO_TIPO = Object.freeze({
  [TIPOS_EVENTO.ARQUIVADO]: 'Arquivado',
  [TIPOS_EVENTO.DESARQUIVADO]: 'Desarquivado',
  [TIPOS_EVENTO.EXCLUIDO]: 'Enviado para a lixeira',
  [TIPOS_EVENTO.RESTAURADO]: 'Restaurado da lixeira',
  [TIPOS_EVENTO.ANONIMIZADO]: 'Dados pessoais removidos a pedido do titular',
});

/** `autor: null` = sistema (import, job) ou usuário removido. */
export function autorDoEvento(evento) {
  return evento.autor?.nome ?? AUTOR_SISTEMA;
}

/**
 * O título do evento e se o autor já está nele ("Criado por Ana", "Ana
 * alterou"). Tipo desconhecido (evento novo no back) vira "Lead alterado".
 *
 * @param {EventoLead} evento
 * @returns {{ titulo: string, comAutor: boolean }}
 */
export function tituloDoEvento(evento) {
  const autor = autorDoEvento(evento);

  switch (evento.tipo) {
    case TIPOS_EVENTO.CRIADO:
      return { titulo: `Criado por ${autor}`, comAutor: true };
    case TIPOS_EVENTO.ATUALIZADO:
      return { titulo: `${autor} alterou`, comAutor: true };
    case TIPOS_EVENTO.MESCLADO:
      return {
        titulo: `Mesclado com ${evento.detalhes?.nomeDescartado || 'outro lead'}`,
        comAutor: false,
      };
    case TIPOS_EVENTO.ENRIQUECIDO: {
      // `detalhes.cnpj` só vem para quem vê o CNPJ.
      const cnpj = evento.detalhes?.cnpj ? ` (CNPJ ${formatarCnpj(evento.detalhes.cnpj)})` : '';
      return { titulo: `Dados da Receita aplicados${cnpj}`, comAutor: false };
    }
    default:
      return { titulo: TITULO_DO_TIPO[evento.tipo] ?? 'Lead alterado', comAutor: false };
  }
}

/**
 * Como a distribuição escolheu o responsável (`detalhes.distribuicao` do
 * `criado`), ou `null`.
 *
 * @param {EventoLead} evento
 */
export function detalheDoEvento(evento) {
  if (evento.tipo !== TIPOS_EVENTO.CRIADO) {
    return null;
  }
  const distribuicao = evento.detalhes?.distribuicao;

  switch (distribuicao?.origem) {
    case ORIGEM_DISTRIBUICAO.REGRA:
      return distribuicao.regraNome
        ? `Atribuído pela regra "${distribuicao.regraNome}"`
        : 'Atribuído por uma regra de distribuição';
    case ORIGEM_DISTRIBUICAO.RODIZIO_GERAL:
      return 'Atribuído pelo rodízio geral';
    case ORIGEM_DISTRIBUICAO.SEM_RESPONSAVEL:
      return 'Ficou sem responsável (nenhuma regra casou)';
    default:
      return null;
  }
}

const vazio = (valor) =>
  valor === null ||
  valor === undefined ||
  valor === '' ||
  (Array.isArray(valor) && valor.length === 0);

function resumir(texto) {
  return texto.length > MAX_VALOR ? `${texto.slice(0, MAX_VALOR - 1)}…` : texto;
}

/**
 * Um lado do diff como texto, ou `null` se vazio. Estágio, responsável e
 * personalizado `usuario` trazem o nome do back (`antesNome`/`depoisNome`;
 * `null` = usuário que já não existe).
 *
 * @param {ItemDiff} item
 * @param {unknown} valor
 * @param {string | null | undefined} nome
 * @param {Map<string, string>} nomePorId
 */
function ladoDoDiff(item, valor, nome, nomePorId) {
  if (vazio(valor)) {
    return null;
  }
  if (nome) {
    return resumir(nome);
  }

  const texto = textoDoValor(item, valor, nomePorId);
  if (texto) {
    return resumir(texto);
  }
  return item.tipo === 'usuario' ? USUARIO_REMOVIDO : resumir(String(valor));
}

/**
 * @param {ItemDiff} item
 * @param {Map<string, string>} nomePorId
 * @returns {{ chave: string, label: string, antes: string | null, depois: string | null }}
 */
export function itemDoDiff(item, nomePorId) {
  return {
    chave: item.chave,
    label: item.label,
    antes: ladoDoDiff(item, item.antes, item.antesNome, nomePorId),
    depois: ladoDoDiff(item, item.depois, item.depoisNome, nomePorId),
  };
}

/**
 * O diff do evento, item a item. A anonimização não mostra diff (os
 * valores eram os dados pessoais).
 *
 * @param {EventoLead} evento
 * @param {Map<string, string>} nomePorId
 */
export function itensDoEvento(evento, nomePorId) {
  if (evento.tipo === TIPOS_EVENTO.ANONIMIZADO) {
    return [];
  }
  return (evento.diff ?? []).map((item) => itemDoDiff(item, nomePorId));
}
