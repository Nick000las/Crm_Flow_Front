import { useEffect, useState } from 'react'
import {
  API_BASE_URL,
  ApiError,
  getBackendHealth,
} from '../services/api.js'

const INITIAL_CONNECTION = {
  status: 'loading',
  health: null,
  error: null,
}
const HEALTH_TIMEOUT_MS = 8_000

function getConnectionError(error) {
  if (error instanceof ApiError) return error.message

  return `Não foi possível acessar ${API_BASE_URL}. Confirme se o backend está em execução.`
}

export function useBackendHealth() {
  const [attempt, setAttempt] = useState(0)
  const [connection, setConnection] = useState(INITIAL_CONNECTION)

  useEffect(() => {
    const controller = new AbortController()
    let disposed = false
    let timedOut = false
    const timeoutId = setTimeout(() => {
      timedOut = true
      controller.abort()
    }, HEALTH_TIMEOUT_MS)

    getBackendHealth({ signal: controller.signal })
      .then((health) => {
        if (!disposed && !timedOut) {
          setConnection({ status: 'success', health, error: null })
        }
      })
      .catch((error) => {
        if (!disposed) {
          setConnection({
            status: 'error',
            health: null,
            error: timedOut
              ? `A API não respondeu em ${HEALTH_TIMEOUT_MS / 1_000} segundos.`
              : getConnectionError(error),
          })
        }
      })
      .finally(() => clearTimeout(timeoutId))

    return () => {
      disposed = true
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [attempt])

  function retry() {
    setConnection(INITIAL_CONNECTION)
    setAttempt((currentAttempt) => currentAttempt + 1)
  }

  return { ...connection, retry }
}
