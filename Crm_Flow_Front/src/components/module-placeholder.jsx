import { EmptyState } from '@/components/empty-state';
import { PLACEHOLDER_ICON } from '@/lib/modules-registry';

export function ModulePlaceholder({
  title = 'Módulo em construção',
  description = 'Esta área ainda não tem funcionalidade nesta etapa do projeto.',
  icon,
  children,
}) {
  const Icon = icon ?? PLACEHOLDER_ICON;

  return (
    <EmptyState icon={Icon} title={title} description={description}>
      {children}
    </EmptyState>
  );
}
