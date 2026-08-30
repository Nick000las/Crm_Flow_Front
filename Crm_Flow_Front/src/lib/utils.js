/**
 * @file Reúne operações reutilizáveis de utils, mantendo cálculos e transformações
 * independentes da interface.
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
