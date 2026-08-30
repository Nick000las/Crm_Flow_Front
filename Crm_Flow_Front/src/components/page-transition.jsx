import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Anima o conteúdo da rota sem remontar seus filhos nem descartar estado local. */
export function PageTransition({ children, className }) {
  const { pathname, search } = useLocation();
  const region = useRef(null);

  useEffect(() => {
    const element = region.current;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches || !element.animate) {
      return;
    }
    const styles = window.getComputedStyle(element);
    const duration = Number.parseFloat(styles.getPropertyValue('--motion-duration-standard'));
    if (!duration) {
      return;
    }
    const animation = element.animate(
      [
        { opacity: 0, transform: 'translateY(6px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration, easing: styles.getPropertyValue('--motion-ease-standard').trim() || 'ease-out' },
    );
    const reduceMotion = (event) => {
      if (event.matches) {
        animation.cancel();
      }
    };
    preference.addEventListener('change', reduceMotion);
    return () => {
      animation.cancel();
      preference.removeEventListener('change', reduceMotion);
    };
  }, [pathname, search]);

  return (
    <div ref={region} className={cn('page-transition', className)}>
      {children}
    </div>
  );
}
