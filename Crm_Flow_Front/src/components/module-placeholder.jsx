import { PLACEHOLDER_ICON } from '@/lib/modules-registry';

export function ModulePlaceholder({
  title = 'Módulo em construção',
  description = 'Esta área ainda não tem funcionalidade nesta etapa do projeto.',
  icon,
  children,
}) {
  const Icon = icon ?? PLACEHOLDER_ICON;

  return (
    <div className="grid justify-items-center gap-3 border border-dashed border-border px-6 py-16 text-center">
      <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
