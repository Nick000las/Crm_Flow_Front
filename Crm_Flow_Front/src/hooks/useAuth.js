import { createAuthSession } from './create-auth-session.js';

/**
 * Sessão do tenant. A mecânica (tokens em memória, refresh single-flight,
 * retentativa única em 401) mora em `createAuthSession` — aqui fica só a
 * instância. A sessão master é uma instância separada, em `use-admin-auth.js`,
 * e as duas nunca compartilham token.
 */
const sessaoTenant = createAuthSession({ nome: 'Auth' });

export const AuthContext = sessaoTenant.Context;
export const AuthProvider = sessaoTenant.Provider;
export const useAuth = sessaoTenant.useSession;
