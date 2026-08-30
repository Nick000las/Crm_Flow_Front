import api, { ApiError } from '@/services/api';
import { createAuthSession } from './create-auth-session.js';

/** Papel exigido para qualquer coisa sob `/admin`. */
const ROLE_MASTER = 'MASTER';

/**
 * Sessão master — instância própria de `createAuthSession`, deliberadamente
 * separada da sessão do tenant: outro contexto, outro estado, outros tokens.
 * Estar logado como tenant não muda nada aqui, nem o contrário.
 *
 * O login usa os mesmos endpoints de `/auth/*` que o tenant (são os mesmos para
 * o backend inteiro), então a única coisa que distingue uma sessão admin é o
 * papel — e ele é conferido antes de a sessão passar a existir.
 */
const sessaoAdmin = createAuthSession({
  nome: 'AdminAuth',
  async resolverUsuario(accessToken) {
    // `/auth/settings` consulta o banco na hora; `/auth/me` só ecoa o payload
    // do JWT. Para uma decisão de permissão vale a fonte que não depende do
    // que foi assinado no token.
    const settings = await api.get('/auth/settings', { accessToken });

    if (settings?.role !== ROLE_MASTER) {
      // `ApiError` e não `Error` para o `ApiErrorAlert` renderizar isso como
      // qualquer outra falha de formulário, sem tratamento especial na tela.
      throw new ApiError('Esta conta não tem acesso administrativo.', {
        status: 403,
        code: 'ADMIN_ACCESS_REQUIRED',
      });
    }

    return settings;
  },
});

export const AdminAuthContext = sessaoAdmin.Context;
export const AdminAuthProvider = sessaoAdmin.Provider;
export const useAdminAuth = sessaoAdmin.useSession;
