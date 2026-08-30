import { TIPOS_CAMPO } from '../constants.js';
import { lerValorDoCampo } from './colunas.js';
import { textoDoValor } from './layout.js';

/**
 * Mesclagem de dois leads (`crm.duplicidade`, DONO/MASTER). O back monta o
 * resultado: campo sem escolha fica com o principal (ou com o secundário,
 * se o principal estiver vazio), tags são unidas. Aqui só se mostra o que
 * difere e se diz, campo a campo, de qual lado vem o valor.
 *
 * @typedef {'a' | 'b'} Lado
 * @typedef {{
 *   chave: string,
 *   label: string,
 *   textoA: string | null,
 *   textoB: string | null,
 *   escolhivel: boolean,
 * }} LinhaMesclagem  `escolhivel` = os dois preenchidos e diferentes
 */

export const LADO = Object.freeze({ A: 'a', B: 'b' });

/** Tags se unem no back: não há o que escolher. */
const CHAVES_UNIDAS = new Set(['tags']);

/** Dados do lead fora de `/fields`, pela chave da API (a mesma de `escolhas`). */
const CAMPOS_DO_LEAD = Object.freeze([
  { chave: 'valor', label: 'Valor', tipo: TIPOS_CAMPO.MONETARIO, coluna: 'valor' },
  {
    chave: 'usuarioResponsavelId',
    label: 'Responsável',
    tipo: 'usuario',
    coluna: 'usuario_responsavel_id',
  },
]);

/**
 * Linhas da comparação: só campos com valor em ao menos um lado e
 * diferentes entre os dois (pelo texto exibido, como a tabela mostra).
 *
 * @param {import('../types.js').Campo[]} campos os da Ficha
 * @param {import('../types.js').Lead} a
 * @param {import('../types.js').Lead} b
 * @param {Map<string, string>} nomePorId
 * @returns {LinhaMesclagem[]}
 */
export function linhasDaMesclagem(campos, a, b, nomePorId) {
  return [...campos, ...CAMPOS_DO_LEAD]
    .filter((campo) => !CHAVES_UNIDAS.has(campo.chave))
    .map((campo) => {
      const textoA = textoDoValor(campo, lerValorDoCampo(a, campo), nomePorId);
      const textoB = textoDoValor(campo, lerValorDoCampo(b, campo), nomePorId);

      return {
        chave: campo.chave,
        label: campo.label,
        textoA,
        textoB,
        escolhivel: Boolean(textoA && textoB),
      };
    })
    .filter((linha) => linha.textoA !== linha.textoB);
}

/**
 * Lado escolhido por campo → `escolhas` do back. Só vai o que difere do
 * padrão (o principal); `undefined` sem nenhuma.
 *
 * @param {Record<string, Lado>} escolhas
 * @param {Lado} principal
 */
export function escolhasParaEnvio(escolhas, principal) {
  const secundarias = Object.entries(escolhas)
    .filter(([, lado]) => lado !== principal)
    .map(([chave]) => [chave, 'secundario']);

  return secundarias.length > 0 ? Object.fromEntries(secundarias) : undefined;
}

/**
 * De onde vem o valor de uma linha: a escolha, se houver; senão o principal,
 * ou o outro lado quando o principal está vazio (a regra do back).
 *
 * @param {LinhaMesclagem} linha
 * @param {Lado | undefined} escolha
 * @param {Lado} principal
 * @returns {Lado}
 */
export function ladoQueFica(linha, escolha, principal) {
  if (linha.escolhivel) {
    return escolha ?? principal;
  }

  const textoDoPrincipal = principal === LADO.A ? linha.textoA : linha.textoB;
  if (textoDoPrincipal) {
    return principal;
  }
  return principal === LADO.A ? LADO.B : LADO.A;
}
