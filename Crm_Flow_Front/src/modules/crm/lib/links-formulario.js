/**
 * @file Por que não dá para gerar link (o back daria 409), ou `null`.
 */
import { estaArquivado } from './arquivo.js';

/**
 * Link pessoal de formulário (FM2, `crm.formularios`): a ficha gera o link de
 * um formulário publicado. Copiar, WhatsApp e QR Code são todos do front; o
 * token só aparece dentro da `url` que o back devolve.
 *
 * @typedef {'active' | 'expired' | 'revoked' | 'submitted'} StatusLink
 * @typedef {{
 *   id: string,
 *   formulario: { id: string, nome: string },
 *   versao: { id: string, versao: number },
 *   oportunidadeId: string | null,
 *   status: StatusLink,
 *   expiraEm: string,
 *   abertoEm: string | null,
 *   respondidoEm: string | null,
 *   revogadoEm: string | null,
 *   criadoEm: string,
 *   criadoPor: string | null,
 * }} LinkDeFormulario
 * @typedef {'copiar' | 'gerar' | null} AcaoDoLink  `copiar` também permite revogar
 */

export const STATUS_LINK = Object.freeze({
  ATIVO: 'active',
  VENCIDO: 'expired',
  CANCELADO: 'revoked',
  RESPONDIDO: 'submitted',
});

const ESTADOS = Object.freeze({
  [STATUS_LINK.ATIVO]: { rotulo: 'Aguardando resposta', acao: 'copiar' },
  [STATUS_LINK.VENCIDO]: { rotulo: 'Vencido', acao: 'gerar' },
  [STATUS_LINK.CANCELADO]: { rotulo: 'Cancelado', acao: 'gerar' },
  // "Ver respostas" chega na FM4.
  [STATUS_LINK.RESPONDIDO]: { rotulo: 'Respondido', acao: null },
});

const TELEFONE_FIXO = 10;
const TELEFONE_CELULAR = 11;
const DDI_BRASIL = '55';

export const MOTIVOS_LINK = Object.freeze({
  ARQUIVADA: 'Pessoa arquivada: desarquive para enviar um formulário.',
  ANONIMIZADA: 'Pessoa anonimizada: não dá para enviar formulário.',
  SEM_TELEFONE: 'A pessoa não tem um telefone do Brasil cadastrado.',
});

/**
 * @param {Pick<LinkDeFormulario, 'status'>} link
 * @returns {{ rotulo: string, acao: AcaoDoLink }}
 */
export function estadoDoLink({ status }) {
  return ESTADOS[status] ?? { rotulo: status, acao: null };
}

/**
 * A `url` vem pronta do back e vale como vem. Sem `FRONTEND_URL` no servidor,
 * ela chega só com o caminho, e o WhatsApp e o QR Code precisam do endereço
 * inteiro: aí ela é resolvida na origem desta tela.
 *
 * @param {string} url
 * @param {string} origem `location.origin`
 */
export function urlAbsoluta(url, origem) {
  return /^https?:\/\//i.test(url) ? url : new URL(url, origem).toString();
}

/**
 * O back grava o telefone só com os dígitos, sem DDI. Fora de 10 ou 11 dígitos
 * (estrangeiro, dado antigo), não dá para montar o número do Brasil.
 *
 * @param {string | null | undefined} telefone
 * @returns {string | null}
 */
export function telefoneDoWhatsapp(telefone) {
  const digitos = String(telefone ?? '').replace(/\D/g, '');

  return digitos.length === TELEFONE_FIXO || digitos.length === TELEFONE_CELULAR ? digitos : null;
}

/**
 * @param {string} digitos de `telefoneDoWhatsapp`
 * @param {string} mensagem
 */
export function linkDoWhatsapp(digitos, mensagem) {
  return `https://wa.me/${DDI_BRASIL}${digitos}?text=${encodeURIComponent(mensagem)}`;
}

/**
 * @param {{ primeiroNome?: string | null, formulario: string, url: string }} dados
 */
export function mensagemDoWhatsapp({ primeiroNome, formulario, url }) {
  const saudacao = primeiroNome?.trim() ? `Olá, ${primeiroNome.trim()}!` : 'Olá!';

  return `${saudacao} Responda o formulário ${formulario}: ${url}`;
}

/**
 * O primeiro nome que o back guarda, ou o primeiro pedaço do Nome.
 *
 * @param {{ primeiro_nome?: string | null, nome?: string | null }} lead
 */
export function primeiroNomeDoLead(lead) {
  return lead.primeiro_nome?.trim() || lead.nome?.trim().split(/\s+/)[0] || null;
}

/**
 * Por que não dá para gerar link (o back daria 409), ou `null`.
 *
 * @param {{ archived_at?: string | null, anonimizado_em?: string | null }} lead
 */
export function motivoSemEnvio(lead) {
  if (lead.anonimizado_em) {
    return MOTIVOS_LINK.ANONIMIZADA;
  }

  return estaArquivado(lead) ? MOTIVOS_LINK.ARQUIVADA : null;
}
