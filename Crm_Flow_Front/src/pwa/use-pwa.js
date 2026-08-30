/**
 * @file Compartilha estado e efeitos de use pwa, na área de aplicação, entre consumidores da
 * interface.
 */
import { useSyncExternalStore } from 'react';

import { pwaStore } from './pwa-store';

export function usePwa() {
  return useSyncExternalStore(pwaStore.subscribe, pwaStore.getSnapshot, pwaStore.getSnapshot);
}
