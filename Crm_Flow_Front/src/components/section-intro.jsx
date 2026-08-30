/**
 * @file Apresenta a finalidade e o uso de uma seção com título, descrição visível e ícone opcional.
 */
import { cn } from '@/lib/utils';

export function SectionIntro({
  title,
  description,
  icon: Icon,
  titleId,
  descriptionId,
  heading: Heading = 'h2',
  className,
}) {
  return (
    <div className={cn('flex min-w-0 items-start gap-2.5', className)}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
      <div className="min-w-0 space-y-1">
        <Heading id={titleId} className="text-sm font-semibold leading-snug text-foreground">
          {title}
        </Heading>
        <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
