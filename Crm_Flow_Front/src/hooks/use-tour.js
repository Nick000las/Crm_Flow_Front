/**
 * @file Gerencia o ciclo de vida do tutorial interativo (Driver.js) para a rota atual,
 * respeitando elementos visíveis, acessibilidade e preferência por movimento reduzido.
 */
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { driver } from 'driver.js';
import { useLocation } from 'react-router-dom';

import { createDriverOptions, resolveTourForRoute, resolveVisibleTourSteps } from '@/lib/tours';

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Expõe o controle de tutorial contextual da tela atual.
 * Encerra automaticamente o tour ao navegar ou desmontar o shell.
 */
export function useTour() {
  const { pathname, search } = useLocation();
  const instanceRef = useRef(null);

  const tour = useMemo(() => resolveTourForRoute(pathname, search), [pathname, search]);

  const stopTour = useCallback(() => {
    if (instanceRef.current) {
      instanceRef.current.destroy();
      instanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopTour();
    };
  }, [pathname, search, stopTour]);

  const startTour = useCallback(() => {
    stopTour();

    const steps = resolveVisibleTourSteps(tour);

    if (steps.length === 0) {
      return;
    }

    const driverInstance = driver({
      ...createDriverOptions(steps, { reducedMotion: prefersReducedMotion() }),
      onDestroyed: () => {
        if (instanceRef.current === driverInstance) {
          instanceRef.current = null;
        }
      },
    });

    instanceRef.current = driverInstance;
    driverInstance.drive();
  }, [stopTour, tour]);

  return {
    startTour,
    stopTour,
    hasTour: Boolean(tour?.steps?.length),
    tourId: tour?.id ?? null,
    tourTitle: tour?.title ?? 'Tutorial desta tela',
  };
}
