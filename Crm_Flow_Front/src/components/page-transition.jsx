/**
 * @file Anima o conteúdo da rota sem remontar seus filhos nem descartar estado local.
 */
import { useLocation } from 'react-router-dom';

import { ContentTransition } from '@/components/motion/content-transition';
import { cn } from '@/lib/utils';

/** Anima o conteúdo da rota sem remontar seus filhos nem descartar estado local. */
export function PageTransition({ children, className }) {
  const { pathname } = useLocation();

  return (
    <ContentTransition transitionKey={pathname} className={cn('page-transition', className)}>
      {children}
    </ContentTransition>
  );
}
