import api, { ApiError } from './api.js';

export function sessionPath(scope = 'tenant') {
  return scope === 'admin' ? '/me?scope=admin' : '/me';
}

/** /auth/session recebe também cookies antigos com Path=/auth. */
export async function restoreSession(
  scope = 'tenant',
  { wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = {},
) {
  const path = scope === 'admin' ? '/auth/session?scope=admin' : '/auth/session';
  const delays = [300, 1000, 2000];
  let response;
  for (let attempt = 0; ; attempt++) {
    try {
      response = await api.get(path, { cache: 'no-store' });
      break;
    } catch (error) {
      const temporary =
        error instanceof ApiError &&
        (error.code === 'NETWORK_ERROR' ||
          (error.status >= 500 && error.code !== 'CRM_SCHEMA_INCOMPATIBLE'));
      if (!temporary || attempt >= delays.length) {
        throw error;
      }
      await wait(delays[attempt]);
    }
  }
  if (response?.accessToken === null && response?.user === null) {
    return null;
  }
  if (
    !response?.accessToken ||
    !response?.user ||
    (scope === 'admin' && response.user.role !== 'MASTER')
  ) {
    throw new ApiError('Sessão inválida ou expirada.', {
      status: 401,
      code: 'AUTH_TOKEN_INVALID',
    });
  }
  return response;
}
