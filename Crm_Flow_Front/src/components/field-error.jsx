/**
 * @file Mensagem de erro inline para campos de formulário. Substitui os balões nativos de
 * validação HTML5 do navegador.
 */
import { CircleAlert } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Mensagem de erro inline para campos de formulário.
 * Substitui os balões nativos de validação HTML5 do navegador.
 */
export function FieldError({ message, id, className }) {
  return message ? (
    <p
      id={id}
      role="alert"
      className={cn('flex items-start gap-1.5 text-xs leading-snug text-destructive', className)}
    >
      <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  ) : null;
}
