/**
 * @file Feedback de borda e sombra sem mover o alvo do clique.
 */
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Feedback de borda e sombra sem mover o alvo do clique.
 */
export function InteractiveCard({ children, className, interactive = true, ...props }) {
  return (
    <Card
      layout="plain"
      className={cn(interactive && 'motion-interactive-card', className)}
      {...props}
    >
      {children}
    </Card>
  );
}
