import { cn } from '@/lib/utils';

/**
 * Feedback de borda e sombra sem mover o alvo do clique.
 */
export function InteractiveCard({ children, className, interactive = true, ...props }) {
  return (
    <div
      className={cn(
        'theme-card rounded-xl border border-border bg-card text-card-foreground shadow-xs',
        interactive && 'motion-interactive-card',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
