import { ORIGEM_DISTRIBUICAO, TIPOS_EVENTO } from '../constants.js';
import { formatarCnpj } from './formatadores.js';
import { textoDoValor } from './layout.js';

/**
 * Histórico do lead em frases ("mudou Status de Novo para Ganho"). Rótulo,
 * tipo e opções de cada item do diff vêm do schema na leitura: renomear um
 * campo não reescreve o histórico, e o texto sai igual ao da tabela.
 *
 * @typedef {import('../api/atividades.api.js').EventoLead} EventoLead
 * @typedef {import('../api/atividades.api.js').ItemDiff} ItemDiff
 */

const AUTOR_SISTEMA = 'Sistema';
const USUARIO_REMOVIDO = 'usuário removido';
const MAX_VALOR = 80;

/**
 * Como a distribuição escolheu o responsável (`detalhes.distribuicao` do `criado`).
 *
 * @param {{ origem: string, regraNome?: string } | undefined} distribuicao
 */
function fraseDaDistribuicao(distribuicao) {
  switch (distribuicao?.origem) {
    case ORIGEM_DISTRIBUICAO.REGRA:
      return distribuicao.regraNome
        ? `responsável definido pela regra "${distribuicao.regraNome}"`
        : 'responsável definido por uma regra de distribuição';
    case ORIGEM_DISTRIBUICAO.RODIZIO_GERAL:
      return 'responsável definido pelo rodízio geral';
    case ORIGEM_DISTRIBUICAO.SEM_RESPONSAVEL:
      return 'ficou sem responsável (nenhuma regra casou)';
    default:
      return null;
  }
}

const FRASE_DO_TIPO = Object.freeze({
  [TIPOS_EVENTO.CRIADO]: 'criou o lead',
  [TIPOS_EVENTO.ATUALIZADO]: 'atualizou o lead',
  [TIPOS_EVENTO.ARQUIVADO]: 'arquivou o lead',
  [TIPOS_EVENTO.DESARQUIVADO]: 'desarquivou o lead',
  [TIPOS_EVENTO.EXCLUIDO]: 'enviou o lead para a lixeira',
  [TIPOS_EVENTO.RESTAURADO]: 'restaurou o lead da lixeira',
  [TIPOS_EVENTO.ANONIMIZADO]: 'anonimizou o lead (pedido do titular)',
});

/** `autor: null` = sistema (import, job) ou usuário removido. */
export function autorDoEvento(evento) {
  return evento.autor?.nome ?? AUTOR_SISTEMA;
}

const vazio = (valor) =>
  valor === null || valor === undefined || valor === '' || (Array.isArray(valor) && valor.length === 0);

function resumir(texto) {
  return texto.length > MAX_VALOR ? `${texto.slice(0, MAX_VALOR - 1)}…` : texto;
}

/**
 * Um lado do diff como texto, ou `null` se vazio. O estágio traz o nome do
 * momento (`antesNome`/`depoisNome`); responsável é id de usuário.
 *
 * @param {ItemDiff} item
 * @param {unknown} valor
 * @param {string | null | undefined} nome
 * @param {Map<string, string>} nomePorId
 */
function ladoDoDiff(item, valor, nome, nomePorId) {
  if (vazio(valor)) return null;
  if (nome) return resumir(nome);

  const texto = textoDoValor(item, valor, nomePorId);
  if (texto) return resumir(texto);
  return item.tipo === 'usuario' ? USUARIO_REMOVIDO : resumir(String(valor));
}

/**
 * @param {ItemDiff} item
 * @param {Map<string, string>} nomePorId
 */
export function fraseDoItem(item, nomePorId) {
  const antes = ladoDoDiff(item, item.antes, item.antesNome, nomePorId);
  const depois = ladoDoDiff(item, item.depois, item.depoisNome, nomePorId);

  if (antes && depois) return `mudou ${item.label} de ${antes} para ${depois}`;
  if (depois) return `preencheu ${item.label} com ${depois}`;
  if (antes) return `limpou ${item.label} (era ${antes})`;
  return `mudou ${item.label}`;
}

/**
 * O que o autor fez: uma frase por campo alterado, ou a frase do tipo do
 * evento. Tipo desconhecido (evento novo no back) vira "alterou o lead".
 *
 * A mesclagem (`detalhes.nomeDescartado`) abre com quem foi mesclado e
 * segue com o que mudou no lead que ficou.
 *
 * @param {EventoLead} evento
 * @param {Map<string, string>} nomePorId
 * @returns {string[]}
 */
export function frasesDoEvento(evento, nomePorId) {
  // M12: na criação, de onde veio o responsável (distribuição automática).
  if (evento.tipo === TIPOS_EVENTO.CRIADO) {
    const distribuicao = fraseDaDistribuicao(evento.detalhes?.distribuicao);
    return distribuicao ? [FRASE_DO_TIPO[evento.tipo], distribuicao] : [FRASE_DO_TIPO[evento.tipo]];
  }
  // M11b: o enriquecimento automático (autor nulo = "Sistema") e o que ele preencheu.
  if (evento.tipo === TIPOS_EVENTO.ENRIQUECIDO) {
    const cnpj = evento.detalhes?.cnpj ? ` (CNPJ ${formatarCnpj(evento.detalhes.cnpj)})` : '';
    return [`preencheu dados da Receita${cnpj}`, ...(evento.diff ?? []).map((item) => fraseDoItem(item, nomePorId))];
  }
  if (evento.tipo === TIPOS_EVENTO.MESCLADO) {
    const descartado = evento.detalhes?.nomeDescartado || 'outro lead';
    return [`mesclou ${descartado} neste lead`, ...(evento.diff ?? []).map((item) => fraseDoItem(item, nomePorId))];
  }
  if (evento.tipo === TIPOS_EVENTO.ATUALIZADO && evento.diff?.length > 0) {
    return evento.diff.map((item) => fraseDoItem(item, nomePorId));
  }

  return [FRASE_DO_TIPO[evento.tipo] ?? 'alterou o lead'];
}
