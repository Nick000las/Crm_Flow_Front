/**
 * @file Renderiza alert, na área de interface compartilhada, expondo os estados e eventos
 * necessários à interface.
 */
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const alertVariants = cva('flex items-start gap-3 rounded-xl border px-3.5 py-3 text-sm', {
  variants: {
    variant: {
      destructive:
        'border-destructive/25 bg-destructive/8 text-destructive dark:border-destructive/35 dark:bg-destructive/12',
      warning: 'border-warning/30 bg-warning/10 text-warning',
      success: 'border-success/25 bg-success/10 text-success',
      info: 'border-info/25 bg-info/10 text-info',
      default: 'border-border bg-surface text-foreground',
    },
  },
  defaultVariants: { variant: 'default' },
});

export function Alert({ variant = 'default', icon: Icon, className, role, children, ...props }) {
  return (
    <div
      data-slot="alert"
      role={role ?? (variant === 'destructive' ? 'alert' : 'status')}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
