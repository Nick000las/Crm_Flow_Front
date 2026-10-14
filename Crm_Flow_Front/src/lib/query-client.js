import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../services/api-error.js'

const STALE_TIME_MS = 30_000
const MAX_RETRIES = 2

/**
 * Erro 4xx (validação, permissão, não encontrado) não melhora ao repetir.
 * Só falha de rede e 5xx merecem nova tentativa.
 *
 * @param {number} failureCount
 * @param {unknown} error
 */
export function shouldRetry(failureCount, error) {
  if (error instanceof ApiError && error.status !== null && error.status < 500) {
    return false
  }

  return failureCount < MAX_RETRIES
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: STALE_TIME_MS },
    },
  })
}
