export function MemberAvatar({ name }) {
  const parts = (name || '?').trim().split(/\s+/u);
  const initials = `${parts[0][0] ?? '?'}${parts.length > 1 ? parts.at(-1)[0] : ''}`;
  return (
    <span className="kb-member-avatar" aria-hidden="true">
      {initials.toLocaleUpperCase('pt-BR')}
    </span>
  );
}
