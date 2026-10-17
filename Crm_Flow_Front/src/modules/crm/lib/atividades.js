import { LIMITES_ATIVIDADE } from '../constants.js';
import { opcaoDoCampo } from './opcoes.js';

/**
 * Regras das atividades do lead (`crm.atividades`). O back valida de novo
 * (400 por campo); aqui só o caso comum, antes de ir à rede.
 *
 * @typedef {import('../api/atividades.api.js').Atividade} Atividade
 * @typedef {{
 *   tipo: string,
 *   titulo: string,
 *   notas: string,
 *   agendadaPara: string,
 *   jaAconteceu: boolean,
 * }} ValoresAtividade  estado do form; `agendadaPara` no formato do `datetime-local`
 */

export const MENSAGENS_ATIVIDADE = Object.freeze({
  TIPO: 'Escolha o tipo da atividade',
  TITULO: 'Informe o título da atividade',
  TITULO_LONGO: `O título vai até ${LIMITES_ATIVIDADE.TITULO} caracteres`,
  NOTAS_LONGAS: `As notas vão até ${LIMITES_ATIVIDADE.NOTAS} caracteres`,
  DATA: 'Informe uma data válida',
});

const SUFIXO_INATIVA = ' (inativa)';
const dois = (numero) => String(numero).padStart(2, '0');

/**
 * ISO → valor do `<input type="datetime-local">`, no fuso de quem usa.
 *
 * @param {string | null | undefined} iso
 */
export function paraInputLocal(iso) {
  const data = iso ? new Date(iso) : null;
  if (!data || Number.isNaN(data.getTime())) return '';

  const dia = `${data.getFullYear()}-${dois(data.getMonth() + 1)}-${dois(data.getDate())}`;
  return `${dia}T${dois(data.getHours())}:${dois(data.getMinutes())}`;
}

/**
 * Valor do `datetime-local` (hora local, sem fuso) → ISO em UTC. `null` se
 * vazio ou inválido.
 *
 * @param {string} texto
 */
export function deInputLocal(texto) {
  if (!texto) return null;

  const data = new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data.toISOString();
}

/** @param {Atividade | null | undefined} [atividade] @returns {ValoresAtividade} */
export function valoresDaAtividade(atividade) {
  return {
    tipo: atividade?.tipo ?? '',
    titulo: atividade?.titulo ?? '',
    notas: atividade?.notas ?? '',
    agendadaPara: paraInputLocal(atividade?.agendadaPara),
    jaAconteceu: false,
  };
}

/** @param {ValoresAtividade} valores @returns {Record<string, string>} */
export function validarAtividade(valores) {
  const erros = {};
  const titulo = valores.titulo.trim();

  if (!valores.tipo) erros.tipo = MENSAGENS_ATIVIDADE.TIPO;
  if (!titulo) erros.titulo = MENSAGENS_ATIVIDADE.TITULO;
  else if (titulo.length > LIMITES_ATIVIDADE.TITULO) erros.titulo = MENSAGENS_ATIVIDADE.TITULO_LONGO;
  if (valores.notas.trim().length > LIMITES_ATIVIDADE.NOTAS) erros.notas = MENSAGENS_ATIVIDADE.NOTAS_LONGAS;
  if (!valores.jaAconteceu && valores.agendadaPara && !deInputLocal(valores.agendadaPara)) {
    erros.agendadaPara = MENSAGENS_ATIVIDADE.DATA;
  }

  return erros;
}

const preenchido = ([, valor]) => valor !== null && valor !== undefined;

/**
 * Corpo do POST (sem `original`) ou do PUT parcial (com `original`). Na
 * edição vai só o que mudou, e vazio vira `null` (limpa); `null` no retorno
 * = nada mudou. "Já aconteceu" cria concluída e sem agenda.
 *
 * @param {ValoresAtividade} valores
 * @param {Atividade | null} [original]
 * @returns {Record<string, unknown> | null}
 */
export function payloadDaAtividade(valores, original = null) {
  const atual = {
    tipo: valores.tipo,
    titulo: valores.titulo.trim(),
    notas: valores.notas.trim() || null,
    agendadaPara: valores.jaAconteceu ? null : deInputLocal(valores.agendadaPara),
  };

  if (!original) {
    return Object.fromEntries(Object.entries({ ...atual, concluida: valores.jaAconteceu || undefined }).filter(preenchido));
  }

  const antes = valoresDaAtividade(original);
  const mudou = {
    tipo: valores.tipo !== antes.tipo,
    titulo: atual.titulo !== antes.titulo.trim(),
    notas: (atual.notas ?? '') !== antes.notas.trim(),
    // Compara no formato do input: o back pode devolver segundos que o input não tem.
    agendadaPara: valores.agendadaPara !== antes.agendadaPara,
  };
  const parcial = Object.fromEntries(Object.entries(atual).filter(([campo]) => mudou[campo]));

  return Object.keys(parcial).length > 0 ? parcial : null;
}

/** @param {Atividade} atividade */
export function estaConcluida(atividade) {
  return Boolean(atividade.concluidaEm);
}

/**
 * Em aberto com agenda no passado.
 *
 * @param {Atividade} atividade
 * @param {Date} [agora]
 */
export function estaAtrasada(atividade, agora = new Date()) {
  if (estaConcluida(atividade) || !atividade.agendadaPara) return false;

  const agenda = Date.parse(atividade.agendadaPara);
  return !Number.isNaN(agenda) && agenda < agora.getTime();
}

/**
 * Abertas e concluídas, cada grupo na ordem que o back mandou.
 *
 * @param {Atividade[]} atividades
 */
export function separarAtividades(atividades) {
  return {
    abertas: atividades.filter((atividade) => !estaConcluida(atividade)),
    concluidas: atividades.filter(estaConcluida),
  };
}

/**
 * A opção do tipo para o selo. Tipo desativado continua com rótulo e cor;
 * tipo desconhecido (sem a lista) vira texto legível.
 *
 * @param {import('./opcoes.js').Opcao[] | undefined} lista
 * @param {string} tipo
 */
export function opcaoDoTipo(lista, tipo) {
  return opcaoDoCampo({ opcoesLista: lista ?? null }, tipo);
}

/**
 * Itens do seletor de tipo: só os ativos, mais o inativo que a atividade já
 * tem (o back aceita manter).
 *
 * @param {import('./opcoes.js').Opcao[] | undefined} lista
 * @param {string} [atual]
 * @returns {{ valor: string, rotulo: string }[]}
 */
export function opcoesDeTipo(lista, atual) {
  const itens = (lista ?? [])
    .filter((opcao) => opcao.ativo)
    .map((opcao) => ({ valor: opcao.key, rotulo: opcao.label }));
  if (!atual || itens.some((item) => item.valor === atual)) return itens;

  const opcao = opcaoDoTipo(lista, atual);
  return [...itens, { valor: opcao.key, rotulo: `${opcao.label}${SUFIXO_INATIVA}` }];
}
