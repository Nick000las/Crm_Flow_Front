/**
 * @file Renderiza stagger list, na área de aplicação, expondo os estados e eventos necessários
 * à interface.
 */
import { FadeIn } from './fade-in';

export function StaggerList({ children, className, ...props }) {
  return (
    <FadeIn className={className} {...props}>
      {children}
    </FadeIn>
  );
}

export function StaggerItem({ children, className, ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
