export const TEAM_PAGE_SIZE = 20;

function normalize(value) {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('pt-BR');
}

export function filterTeamMembers(members, selectedIds, query, filter) {
  const terms = normalize(query.trim()).split(/\s+/u).filter(Boolean);
  return members.filter((member) => {
    const selected = selectedIds.has(member.id);
    return (
      (filter !== 'selected' || selected) &&
      (filter !== 'available' || !selected) &&
      terms.every((term) => normalize(member.nome).includes(term))
    );
  });
}

export function updateTeamSelection(current, ids, selected) {
  const next = new Set(current);
  for (const id of ids) {
    if (selected) {
      next.add(id);
    } else {
      next.delete(id);
    }
  }
  return next;
}
