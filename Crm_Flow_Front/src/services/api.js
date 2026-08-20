const DEFAULT_API_URL = 'http://localhost:3000'

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL
).replace(/\/+$/, '')

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

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

  const response = await fetch(buildApiUrl(path), {
    ...requestOptions,
    headers,
    body: json === undefined ? requestOptions.body : JSON.stringify(json),
  })
  const data = await readResponse(response)

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data
        ? data.error
        : `A API respondeu com o status ${response.status}`

    throw new ApiError(message, response.status, data)
  }

  return data
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
  const data = await apiRequest('/health', options)

  if (!isBackendHealth(data)) {
    throw new ApiError(
      'A API respondeu, mas o health check retornou dados inválidos.',
      200,
      data,
    )
  }

  return data
}
