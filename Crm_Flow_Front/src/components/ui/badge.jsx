/**
 * @file Renderiza badge, na área de interface compartilhada, expondo os estados e eventos
 * necessários à interface.
 */
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { cva } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground [a]:hover:bg-accent',
        destructive:
          'border-destructive/20 bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:border-destructive/30 dark:bg-destructive/20 [a]:hover:bg-destructive/20',
        success:
          'border-success/20 bg-success/10 text-success dark:border-success/30 dark:bg-success/15',
        warning:
          'border-warning/25 bg-warning/15 text-warning-foreground dark:border-warning/30 dark:bg-warning/15 dark:text-warning',
        info: 'border-info/20 bg-info/10 text-info dark:border-info/30 dark:bg-info/15',
        outline:
          'border-border bg-card text-foreground [a]:hover:bg-accent [a]:hover:text-foreground',
        ghost: 'hover:bg-accent hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

function Badge({ className, variant = 'default', render, ...props }) {
  return useRender({
    defaultTagName: 'span',
    props: mergeProps(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: {
      slot: 'badge',
      variant,
    },
  });
}

export { Badge, badgeVariants };
