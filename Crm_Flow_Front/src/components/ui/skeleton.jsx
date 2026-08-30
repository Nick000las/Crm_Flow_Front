/**
 * @file Renderiza skeleton, na área de interface compartilhada, expondo os estados e eventos
 * necessários à interface.
 */
import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }) {
  return (
    <div
      data-slot="skeleton"
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton };
