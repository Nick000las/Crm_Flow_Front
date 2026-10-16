import { CAMADA } from '../constants.js';

/**
 * Opções de campos de seleção. Status, origem, motivo de perda e tags são
 * listas do tenant (Configurações › Listas): `/crm/leads/fields` manda
 * `opcoes` (keys ativas — o que o seletor oferece) e `opcoesLista` (todas,
 * com label, cor, categoria e `ativo`). Nada de rótulo fixo no front.
 *
 * @typedef {{
 *   key: string,
 *   label: string,
 *   color: string | null,
 *   category: 'aberto' | 'ganho' | 'perdido' | null,
 *   ativo: boolean,
 * }} Opcao
 *
 * @typedef {{ valor: string, rotulo: string }} ItemDeSeletor
 */

const SUFIXO_INATIVA = ' (inativa)';

/** `fora_do_perfil` → `Fora do perfil`. Último recurso para valor sem opção conhecida. */
export function humanizar(valor) {
  const texto = String(valor).replaceAll('_', ' ').trim();

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

const vazio = (valor) => valor === null || valor === undefined || valor === '';

/**
 * A opção de um valor gravado. Fora da lista (dado antigo, campo sem lista),
 * vira uma opção ativa sem cor — o valor nunca some da tela.
 *
 * @param {{ camada?: number, opcoesLista?: Opcao[] | null } | undefined} campo
 * @param {unknown} valor
 * @returns {Opcao | null}
 */
export function opcaoDoCampo(campo, valor) {
  if (vazio(valor)) return null;

  const key = String(valor);
  const daLista = campo?.opcoesLista?.find((opcao) => opcao.key === key);
  if (daLista) return daLista;

  // Opção da Camada 3 já é o texto que o usuário escreveu.
  const label = campo?.camada === CAMADA.CAMADA_3 ? key : humanizar(key);
  return { key, label, color: null, category: null, ativo: true };
}

/**
 * @param {unknown} valor
 * @param {Parameters<typeof opcaoDoCampo>[0]} [campo]
 */
export function rotuloOpcao(valor, campo) {
  return opcaoDoCampo(campo, valor)?.label ?? '';
}

const rotuloComSituacao = (opcao) => (opcao.ativo ? opcao.label : `${opcao.label}${SUFIXO_INATIVA}`);

/**
 * Itens do seletor do formulário: só as ativas — mais a inativa que o lead
 * já tem, para ela continuar selecionada (o back aceita manter).
 *
 * @param {{ opcoes?: string[] | null, opcoesLista?: Opcao[] | null, camada?: number }} campo
 * @param {unknown} [valorAtual]
 * @returns {ItemDeSeletor[]}
 */
export function opcoesDoSeletor(campo, valorAtual) {
  const keys = campo.opcoes ?? [];
  const itens = keys.map((key) => ({ valor: key, rotulo: rotuloOpcao(key, campo) }));

  if (vazio(valorAtual) || keys.includes(String(valorAtual))) return itens;

  const atual = opcaoDoCampo(campo, valorAtual);
  return [...itens, { valor: atual.key, rotulo: rotuloComSituacao(atual) }];
}

/**
 * Itens do filtro: todas as opções, inclusive inativas — filtrar leads
 * antigos por uma opção desativada é legítimo. Sem `opcoesLista` (Camada 3),
 * as `opcoes` do campo.
 *
 * @param {{ opcoes?: string[] | null, opcoesLista?: Opcao[] | null, camada?: number }} campo
 * @returns {ItemDeSeletor[]}
 */
export function opcoesDoFiltro(campo) {
  if (Array.isArray(campo.opcoesLista)) {
    return campo.opcoesLista.map((opcao) => ({ valor: opcao.key, rotulo: rotuloComSituacao(opcao) }));
  }

  return (campo.opcoes ?? []).map((key) => ({ valor: key, rotulo: rotuloOpcao(key, campo) }));
}

/**
 * Lista de entrada livre (tags): o form edita por nome e o back casa por
 * key, nome ou slug — criando a opção se for texto novo.
 *
 * @param {{ opcoes?: string[] | null, opcoesLista?: Opcao[] | null }} campo
 */
export function ehListaLivre(campo) {
  return Array.isArray(campo.opcoesLista) && !Array.isArray(campo.opcoes);
}

/** Nomes das opções ativas, para autocompletar a entrada livre. */
export function sugestoesDoCampo(campo) {
  return (campo.opcoesLista ?? []).filter((opcao) => opcao.ativo).map((opcao) => opcao.label);
}
