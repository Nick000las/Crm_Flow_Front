import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Ícone decorativo; o rótulo acessível pertence ao componente em carregamento. */
export function Spinner({ className }) {
  return (
    <LoaderCircle
      aria-hidden="true"
      className={cn('size-4 shrink-0 motion-safe:animate-spin', className)}
    />
  );
}
