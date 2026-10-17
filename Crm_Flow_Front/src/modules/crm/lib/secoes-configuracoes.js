import { podeVer } from '../../../lib/acesso.js';
import { CRM_FEATURES, PAPEIS_GESTAO } from '../constants.js';
import { ROTAS_CRM } from '../rotas.js';

/**
 * Subseções da área Configurações do CRM (spec "Configurações e Features",
 * tabela de subseções). É a navegação interna da área — a página "Configurações"
 * em si mora no registry (`modules-registry.js`).
 *
 * Campos vale sempre (DONO/MASTER). As demais nascem atrás da flag própria
 * (rollout); `pronta: false` = ainda sem tela no front: some mesmo com a flag
 * ligada, para o MASTER não abrir uma subseção vazia ao ligar a flag cedo.
 * Papel por subseção: o Layout é de todos (cada um edita o próprio; o
 * padrão da empresa, só gestão — decidido dentro da tela), e a Duplicidade
 * todos leem (só gestão altera).
 *
 * @typedef {Object} SecaoConfiguracoes
 * @property {string} key       segmento de `/crm/configuracoes/:secao`
 * @property {string} label
 * @property {string} [feature]  omitida = sem flag
 * @property {readonly string[]} [roles]  omitido = todos os papéis
 * @property {boolean} pronta
 */

const secao = (key, label, feature, { pronta = false, roles = PAPEIS_GESTAO } = {}) =>
  Object.freeze({ key, label, ...(feature && { feature }), ...(roles && { roles }), pronta });

/** @type {readonly SecaoConfiguracoes[]} */
export const SECOES_CONFIGURACOES = Object.freeze([
  secao('layout', 'Layout do lead', CRM_FEATURES.LAYOUT, { pronta: true, roles: null }),
  secao('campos', 'Campos', null, { pronta: true }),
  secao('listas', 'Listas', CRM_FEATURES.LISTAS, { pronta: true }),
  secao('regras', 'Regras de campo', CRM_FEATURES.REGRAS, { pronta: true }),
  // Leitura para todos; alterar as regras, só gestão (decidido na tela).
  secao('duplicidade', 'Duplicidade', CRM_FEATURES.DUPLICIDADE, { pronta: true, roles: null }),
  secao('distribuicao', 'Distribuição', CRM_FEATURES.DISTRIBUICAO),
  secao('inatividade', 'Inatividade', CRM_FEATURES.INATIVIDADE),
  secao('pontuacao', 'Pontuação', CRM_FEATURES.SCORE),
  secao('enriquecimento', 'Enriquecimento', CRM_FEATURES.CNPJ),
  secao('privacidade', 'Privacidade (LGPD)', CRM_FEATURES.LGPD),
]);

/** @param {Parameters<typeof podeVer>[1]} user */
export function secoesVisiveis(user) {
  return SECOES_CONFIGURACOES.filter((item) => item.pronta && podeVer(item, user));
}

/** @param {string} key */
export const caminhoDaSecao = (key) => `${ROTAS_CRM.CONFIGURACOES}/${encodeURIComponent(key)}`;
