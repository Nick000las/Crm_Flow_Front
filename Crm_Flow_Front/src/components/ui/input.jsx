/**
 * @file Renderiza input, na área de interface compartilhada, expondo os estados e eventos
 * necessários à interface.
 */
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/utils';

import { controlVariants } from './control-styles';

function Input({
  className,
  type,
  size = 'default',
  startIcon: StartIcon,
  wrapperClassName,
  ...props
}) {
  const Component = type === 'file' ? 'input' : InputPrimitive;
  const control = (
    <Component
      type={type}
      data-slot="input"
      data-size={size}
      className={cn(
        controlVariants({ size }),
        'file:mr-3 file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        StartIcon && 'pl-9',
        className,
      )}
      {...props}
    />
  );

  return StartIcon ? (
    <span className={cn('relative flex min-w-0 flex-1', wrapperClassName)}>
      <StartIcon
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      {control}
    </span>
  ) : (
    control
  );
}

export { Input };
