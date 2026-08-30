import api from '@/services/api';
import { queryClient } from '@/lib/query-client';
import { createAuthSession, getResponseUser } from './create-auth-session.js';

/**
 * Sessão do tenant. A mecânica (access token em memória, refresh
 * single-flight, retentativa única em 401, restauração pelo cookie) mora em
 * `createAuthSession` — aqui fica só a instância. A sessão master é uma
 * instância separada, em `use-admin-auth.js`, e as duas nunca compartilham
 * token.
 */
const sessaoTenant = createAuthSession({
  nome: 'Auth',
  // Refresh token em cookie httpOnly: a sessão sobrevive ao F5.
  persistente: true,
  onSessionChange: () => queryClient.clear(),
  // Sempre `/me`, nunca o usuário da resposta do login: é ele que traz
  // `modulosAtivos` e `featuresAtivas`, usados para esconder da navegação
  // módulo não contratado e funcionalidade com feature flag desligada.
  async resolverUsuario(accessToken) {
    const response = await api.get('/me', { accessToken, cache: 'no-store' });

    return getResponseUser(response);
  },
});

export const AuthContext = sessaoTenant.Context;
export const AuthProvider = sessaoTenant.Provider;
export const useAuth = sessaoTenant.useSession;
