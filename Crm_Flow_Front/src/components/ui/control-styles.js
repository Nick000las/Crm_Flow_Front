/**
 * @file Aparência comum a inputs, textareas e selects nativos ou Base UI.
 */
import { cva } from 'class-variance-authority';

/** Aparência comum a inputs, textareas e selects nativos ou Base UI. */
export const controlVariants = cva(
  'w-full min-w-0 rounded-lg border border-input bg-card text-foreground shadow-xs transition-[border-color,box-shadow,background-color] duration-150 outline-none placeholder:text-muted-foreground/75 hover:enabled:border-border-strong focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:bg-muted/60 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-surface dark:aria-invalid:border-destructive/60 dark:aria-invalid:ring-destructive/35',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 py-1 text-xs',
        default: 'h-9 px-3 py-1.5 text-base md:text-sm',
        lg: 'h-11 px-3.5 py-2 text-base',
      },
    },
    defaultVariants: { size: 'default' },
  },
);
