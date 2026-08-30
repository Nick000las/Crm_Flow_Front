const DEFAULT_ERROR_MESSAGE = 'Não foi possível concluir a solicitação.';

export const CLIENT_ERROR_CODES = Object.freeze({
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_ABORTED: 'REQUEST_ABORTED',
  INVALID_REQUEST: 'INVALID_REQUEST',
  INVALID_RESPONSE: 'INVALID_RESPONSE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
});

/** 403 de acesso por contratação/rollout — não é falta de permissão do papel. */
export const ACCESS_ERROR_CODES = Object.freeze({
  MODULE_NOT_ENABLED: 'MODULE_NOT_ENABLED',
  FEATURE_NOT_ENABLED: 'FEATURE_NOT_ENABLED',
});

// Texto do front para esses códigos: o usuário final não liga módulo nem
// flag, então a mensagem diz o que aconteceu sem jargão de configuração.
const ACCESS_ERROR_MESSAGES = Object.freeze({
  [ACCESS_ERROR_CODES.MODULE_NOT_ENABLED]: 'Este módulo não está ativo para a sua empresa.',
  [ACCESS_ERROR_CODES.FEATURE_NOT_ENABLED]:
    'Esta funcionalidade ainda não está disponível para a sua empresa.',
});

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{
   *   status?: number | null,
   *   code?: string,
   *   fields?: Record<string, string[]>,
   *   details?: unknown,
   *   requestId?: string | null,
   *   data?: unknown,
   *   cause?: unknown,
   * }} [options]
   */
  constructor(message, options = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'ApiError';
    this.status = options.status ?? null;
    this.code = options.code ?? CLIENT_ERROR_CODES.UNKNOWN_ERROR;
    this.fields = options.fields ?? {};
    this.details = options.details;
    this.requestId = options.requestId ?? null;
    this.data = options.data;
  }
}

/** @param {unknown} payload @param {number} status */
export function createApiErrorFromResponse(payload, status) {
  const body = isRecord(payload) ? payload : null;
  const rawError = body?.error;
  const error = isRecord(rawError) ? rawError : null;
  const hasCanonicalErrorEnvelope =
    body?.statusCode === status &&
    typeof error?.code === 'string' &&
    typeof error.message === 'string';
  const canUseResponseMessage = status < 500 || hasCanonicalErrorEnvelope;

  const code = firstNonEmptyString(error?.code, body?.code, CLIENT_ERROR_CODES.UNKNOWN_ERROR);
  const message =
    ACCESS_ERROR_MESSAGES[code] ??
    (canUseResponseMessage
      ? firstNonEmptyString(
          error?.message,
          typeof rawError === 'string' ? rawError : null,
          body?.message,
          getStatusFallback(status),
        )
      : getStatusFallback(status));
  const requestId = firstNonEmptyString(error?.requestId, body?.requestId);

  return new ApiError(message, {
    status,
    code,
    fields: normalizeFields(error?.fields),
    details: error?.details,
    requestId,
    data: payload,
  });
}

/** @param {unknown} error */
export function createNetworkError(error) {
  if (isAbortError(error)) {
    return new ApiError('Solicitação cancelada.', {
      code: CLIENT_ERROR_CODES.REQUEST_ABORTED,
      cause: error,
    });
  }

  return new ApiError(
    'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
    {
      code: CLIENT_ERROR_CODES.NETWORK_ERROR,
      cause: error,
    },
  );
}

/**
 * 403 de contratação/rollout: a tela mostra um estado próprio
 * (`AcessoIndisponivel`) em vez de um alerta de erro.
 *
 * @param {unknown} error
 */
export function isAccessError(error) {
  return error instanceof ApiError && Object.hasOwn(ACCESS_ERROR_MESSAGES, error.code);
}

/** @param {unknown} error */
export function isAbortError(error) {
  return (
    (error instanceof ApiError && error.code === CLIENT_ERROR_CODES.REQUEST_ABORTED) ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

/** @param {unknown} error @param {string} [fallbackMessage] */
export function toApiError(error, fallbackMessage = DEFAULT_ERROR_MESSAGE) {
  if (error instanceof ApiError) {
    return error;
  }
  if (isAbortError(error)) {
    return createNetworkError(error);
  }

  return new ApiError(fallbackMessage, {
    code: CLIENT_ERROR_CODES.UNKNOWN_ERROR,
    cause: error,
  });
}

/** @param {unknown} error @param {string} field */
export function getFieldError(error, field) {
  return toApiError(error).fields[field]?.[0] ?? null;
}

/** @param {number} status */
function getStatusFallback(status) {
  switch (status) {
    case 400:
      return 'Revise os dados enviados.';
    case 401:
      return 'Sua autenticação não foi aceita.';
    case 403:
      return 'Você não tem permissão para realizar esta ação.';
    case 404:
      return 'O recurso solicitado não foi encontrado.';
    case 409:
      return 'A solicitação entrou em conflito com os dados atuais.';
    case 429:
      return 'Muitas tentativas. Aguarde e tente novamente.';
    default:
      return status >= 500
        ? 'O servidor está temporariamente indisponível.'
        : DEFAULT_ERROR_MESSAGE;
  }
}

/** @param {unknown} value */
function normalizeFields(value) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([field, messages]) => {
      const normalizedMessages = (Array.isArray(messages) ? messages : [messages]).filter(
        (message) => typeof message === 'string' && message.trim(),
      );

      return normalizedMessages.length > 0 ? [[field, normalizedMessages]] : [];
    }),
  );
}

/** @param {...unknown} values */
function firstNonEmptyString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim()) ?? null;
}

/** @param {unknown} value */
function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
