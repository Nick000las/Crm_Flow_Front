import { CAMADA } from '../constants.js';

/**
 * Valores fechados das Camadas 1 e 2 chegam crus do back (`em_contato`,
 * `trafego_pago`). Os conhecidos ganham rótulo; um valor novo cai no
 * `humanizar`, para aparecer legível em vez de sumir.
 */
const ROTULOS_OPCAO = Object.freeze({
  // status
  novo: 'Novo',
  em_contato: 'Em contato',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
  // fonte_lead
  whatsapp: 'WhatsApp',
  formulario_site: 'Formulário do site',
  indicacao: 'Indicação',
  trafego_pago: 'Tráfego pago',
  evento: 'Evento',
  importacao_manual: 'Importação manual',
  // motivo_perda
  preco: 'Preço',
  concorrente: 'Concorrente',
  sem_orcamento: 'Sem orçamento',
  sem_resposta: 'Sem resposta',
  fora_do_perfil: 'Fora do perfil',
  outro: 'Outro',
});

/** `fora_do_perfil` → `Fora do perfil`. */
export function humanizar(valor) {
  const texto = String(valor).replaceAll('_', ' ').trim();

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/**
 * Rótulo de uma opção de seleção. Opções da Camada 3 já são texto escrito
 * pelo usuário e voltam como estão.
 *
 * @param {unknown} valor
 * @param {{ camada?: number }} [campo]
 */
export function rotuloOpcao(valor, campo) {
  if (valor === null || valor === undefined || valor === '') return '';
  if (campo?.camada === CAMADA.CAMADA_3) return String(valor);

  return ROTULOS_OPCAO[valor] ?? humanizar(valor);
}
