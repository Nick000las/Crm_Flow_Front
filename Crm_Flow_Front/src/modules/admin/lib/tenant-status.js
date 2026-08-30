/**
 * Espelha `TENANT_STATUS` de `shared/constants/index.js` no backend, que é o
 * que `PUT /admin/tenants/:id/status` valida com `z.enum`. As chaves são
 * minúsculas e misturam português e inglês (`active` ao lado de `suspenso`):
 * é uma inconsistência real do backend, não intencional, mas é o contrato de
 * hoje — o front escreve exatamente essas strings, sem normalizar caixa nem
 * idioma, senão o enum rejeita.
 *
 * A ordem é a do ciclo de vida da conta, que é como o seletor apresenta.
 */
const STATUS_LABELS = {
  trial: 'Avaliação',
  active: 'Ativo',
  past_due: 'Em atraso',
  suspenso: 'Suspenso',
  cancelado: 'Cancelado',
};

/** Ordem de exibição no seletor. */
export const TENANT_STATUS_OPTIONS = Object.keys(STATUS_LABELS);

/**
 * Cai para o valor cru em chave desconhecida, para que um status novo apareça
 * na tela em vez de sumir.
 *
 * @param {string} status
 */
export function getTenantStatusLabel(status) {
  if (!status) return '—';

  return STATUS_LABELS[status] ?? status;
}

/**
 * Só `active` usa a cor de destaque — a regra do design system reserva o
 * accent para poucos lugares. `past_due` é a única outra exceção: sinaliza uma
 * conta com pagamento pendente, e aí a cor carrega informação em vez de
 * decorar. O resto fica no cinza da interface, distinguido pelo rótulo.
 *
 * @param {string} status
 */
export function getTenantStatusTone(status) {
  if (status === 'active') return 'text-primary';
  if (status === 'past_due') return 'text-destructive';
  if (status === 'cancelado') return 'text-muted-foreground';

  return 'text-foreground';
}
