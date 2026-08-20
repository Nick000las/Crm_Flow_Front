import {
  ApiError,
  CLIENT_ERROR_CODES,
  createApiErrorFromResponse,
  createNetworkError,
} from './api-error.js'

export {
  ApiError,
  CLIENT_ERROR_CODES,
  getFieldError,
  isAbortError,
  toApiError,
} from './api-error.js'

const DEFAULT_API_URL = 'http://localhost:3000'

export const API_BASE_URL = (
  import.meta.env?.VITE_API_URL?.trim() || DEFAULT_API_URL
).replace(/\/+$/, '')

function buildApiUrl(path) {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`
}

async function readResponse(response) {
  if (response.status === 204) return null

  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/**
 * Cliente HTTP compartilhado para chamadas ao backend.
 *
 * @param {string} path
 * @param {RequestInit & { accessToken?: string, json?: unknown }} [options]
 */
export async function apiRequest(path, options = {}) {
  const {
    accessToken,
    json,
    headers: customHeaders,
    ...requestOptions
  } = options
  const headers = new Headers(customHeaders)

  headers.set('Accept', 'application/json')

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  if (json !== undefined) {
    headers.set('Content-Type', 'application/json')
  }

  let response
  let data
  let body = requestOptions.body

  if (json !== undefined) {
    try {
      body = JSON.stringify(json)
    } catch (cause) {
      throw new ApiError('Não foi possível preparar os dados da solicitação.', {
        code: CLIENT_ERROR_CODES.INVALID_REQUEST,
        cause,
      })
    }
  }

  try {
    response = await fetch(buildApiUrl(path), {
      ...requestOptions,
      credentials: requestOptions.credentials ?? 'include',
      headers,
      body,
    })
    data = await readResponse(response)
  } catch (error) {
    throw createNetworkError(error)
  }

  if (!response.ok) {
    throw createApiErrorFromResponse(data, response.status)
  }

  return unwrapResponseData(data)
}

/**
 * Cliente HTTP compartilhado. Os métodos retornam diretamente o corpo da
 * resposta já convertido de JSON.
 */
export const api = {
  request: apiRequest,

  get(path, options = {}) {
    return apiRequest(path, { ...options, method: 'GET' })
  },

  post(path, json, options = {}) {
    return apiRequest(path, { ...options, method: 'POST', json })
  },

  put(path, json, options = {}) {
    return apiRequest(path, { ...options, method: 'PUT', json })
  },

  patch(path, json, options = {}) {
    return apiRequest(path, { ...options, method: 'PATCH', json })
  },

  delete(path, options = {}) {
    return apiRequest(path, { ...options, method: 'DELETE' })
  },
}

function isBackendHealth(data) {
  return (
    data !== null &&
    typeof data === 'object' &&
    data.status === 'ok' &&
    typeof data.service === 'string' &&
    Array.isArray(data.modules) &&
    data.modules.every((module) => typeof module === 'string') &&
    Number.isInteger(data.uptimeSeconds) &&
    data.uptimeSeconds >= 0
  )
}

export async function getBackendHealth(options = {}) {
  const data = await api.get('/health', options)

  if (!isBackendHealth(data)) {
    throw new ApiError(
      'A API respondeu, mas o health check retornou dados inválidos.',
      {
        status: 200,
        code: CLIENT_ERROR_CODES.INVALID_RESPONSE,
        data,
      },
    )
  }

  return data
}

export default api

/** @param {unknown} payload */
function unwrapResponseData(payload) {
  if (
    payload !== null &&
    typeof payload === 'object' &&
    !Array.isArray(payload) &&
    Object.prototype.hasOwnProperty.call(payload, 'data') &&
    typeof payload.statusCode === 'number' &&
    !Object.prototype.hasOwnProperty.call(payload, 'error')
  ) {
    return payload.data
  }

  return payload
}
