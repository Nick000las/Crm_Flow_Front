/**
 * @file Renderiza textarea, na área de interface compartilhada, expondo os estados e eventos
 * necessários à interface.
 */
import { cn } from '@/lib/utils';

import { controlVariants } from './control-styles';

function Textarea({ className, size = 'default', ...props }) {
  return (
    <textarea
      data-slot="textarea"
      data-size={size}
      className={cn(
        controlVariants({ size }),
        'field-sizing-content h-auto min-h-24 resize-y py-2',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
