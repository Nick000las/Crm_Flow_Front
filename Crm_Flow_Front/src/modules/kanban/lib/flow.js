/**
 * @file Reúne operações reutilizáveis de flow, mantendo cálculos e transformações independentes
 * da interface.
 */
export function getStageAge(card, now, staleDays = 7) {
  const since = Date.parse(card.etapaDesde ?? card.createdAt);

  if (!Number.isFinite(since) || !Number.isFinite(now)) {
    return null;
  }

  const hours = Math.max(0, Math.floor((now - since) / 3600000));
  const days = Math.floor(hours / 24);

  return {
    hours,
    stale: staleDays !== null && !card.dadosExtras?.prazoConcluido && days >= staleDays,
    label:
      days > 0 ? `${days} ${days === 1 ? 'dia' : 'dias'} nesta etapa` : `${hours} h nesta etapa`,
  };
}

export function columnRulesFromForm(form) {
  return {
    exigirResponsavel: form.has('exigirResponsavel'),
    exigirPrazo: form.has('exigirPrazo'),
    exigirChecklist: form.has('exigirChecklist'),
    diasSemMovimento: form.get('diasSemMovimento') ? Number(form.get('diasSemMovimento')) : null,
    automacao: {
      concluir: form.has('automacaoConcluir'),
      responsavelId: form.get('automacaoResponsavel') || null,
      prazoDias:
        form.get('automacaoPrazoDias') !== null && form.get('automacaoPrazoDias') !== ''
          ? Number(form.get('automacaoPrazoDias'))
          : null,
      tarefa: String(form.get('automacaoTarefa') ?? '').trim(),
    },
  };
}
