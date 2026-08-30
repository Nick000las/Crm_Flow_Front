export const PRIORITIES = [
  { value: 'sem_prioridade', label: 'Sem prioridade' },
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];

export const LABEL_COLORS = [
  { value: 'azul', label: 'Azul' },
  { value: 'verde', label: 'Verde' },
  { value: 'amarelo', label: 'Amarelo' },
  { value: 'vermelho', label: 'Vermelho' },
  { value: 'roxo', label: 'Roxo' },
  { value: 'cinza', label: 'Cinza' },
];

export function getCardDetails(card) {
  const details = card.dadosExtras ?? {};
  return {
    descricao: typeof details.descricao === 'string' ? details.descricao : '',
    prioridade: PRIORITIES.some((item) => item.value === details.prioridade)
      ? details.prioridade
      : 'sem_prioridade',
    prazo:
      typeof details.prazo === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(details.prazo)
        ? details.prazo
        : '',
    prazoConcluido: details.prazoConcluido === true,
    etiquetas: Array.isArray(details.etiquetas)
      ? details.etiquetas.filter(
          (item) => item && typeof item.id === 'string' && typeof item.nome === 'string',
        )
      : [],
    checklist: Array.isArray(details.checklist)
      ? details.checklist.filter(
          (item) => item && typeof item.id === 'string' && typeof item.titulo === 'string',
        )
      : [],
  };
}

export function getDueState(prazo, concluido, today = new Date()) {
  if (!prazo) {
    return null;
  }
  if (concluido) {
    return { key: 'done', label: 'Concluído' };
  }
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (prazo < localDate) {
    return { key: 'overdue', label: 'Atrasado' };
  }
  return prazo === localDate
    ? { key: 'today', label: 'Vence hoje' }
    : { key: 'scheduled', label: 'No prazo' };
}

export function formatDueDate(prazo) {
  return prazo ? prazo.split('-').reverse().join('/') : '';
}

/** Respostas paralelas podem chegar fora de ordem; só uma versão mais nova é conflito. */
export function hasNewerCardVersion(card, latestCard) {
  return Boolean(
    card.id &&
    card.id === latestCard?.id &&
    Date.parse(latestCard.updatedAt) > Date.parse(card.updatedAt),
  );
}
