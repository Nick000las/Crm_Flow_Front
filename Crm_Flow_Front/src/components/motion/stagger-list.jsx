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
