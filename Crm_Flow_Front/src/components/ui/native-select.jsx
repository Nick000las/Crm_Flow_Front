/**
 * @file Preserva options, eventos, refs e valores de formulários do select HTML.
 */
import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';

import { controlVariants } from './control-styles';

/** Preserva options, eventos, refs e valores de formulários do select HTML. */
export function NativeSelect({
  className,
  wrapperClassName,
  size = 'default',
  children,
  multiple,
  ...props
}) {
  return (
    <span
      data-slot="native-select-wrapper"
      className={cn('relative flex min-w-0 flex-1', wrapperClassName)}
    >
      <select
        data-slot="native-select"
        data-size={size}
        multiple={multiple}
        className={cn(
          controlVariants({ size }),
          !multiple && 'appearance-none pr-9',
          multiple && 'h-auto min-h-24 py-2',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {!multiple && (
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      )}
    </span>
  );
}
