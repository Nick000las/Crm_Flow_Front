import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { temFeature } from '@/lib/acesso';
import { consultarCnpj, obterConfigCnpj, salvarConfigCnpj } from '../api/cnpj.api';
import { CRM_FEATURES } from '../constants';
import { crmKeys } from '../query-keys';

const HTTP_FORBIDDEN = 403;

/** Configuração do enriquecimento. Só busca com `crm.cnpj`. */
export function useConfigCnpj() {
  const { authApi, user } = useAuth();

  return useQuery({
    queryKey: crmKeys.configCnpj(),
    queryFn: ({ signal }) => obterConfigCnpj(authApi, { signal }),
    enabled: temFeature(user, CRM_FEATURES.CNPJ),
  });
}

/** A resposta é a configuração inteira: vira o cache. */
export function useSalvarConfigCnpj() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config) => salvarConfigCnpj(authApi, config),
    onSuccess: (config) => queryClient.setQueryData(crmKeys.configCnpj(), config),
  });
}

/**
 * Lupa: ação do usuário, sem cache de tela (o back já guarda 30 dias).
 *
 * 403 = o enriquecimento foi desligado depois que a configuração carregou:
 * ela fica velha, sem recarregar agora — a mensagem continua na tela e a
 * lupa some na próxima vez que o form abrir.
 */
export function useConsultarCnpj() {
  const { authApi } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cnpj) => consultarCnpj(authApi, cnpj),
    onError: (erro) => {
      if (erro?.status === HTTP_FORBIDDEN) {
        queryClient.invalidateQueries({ queryKey: crmKeys.configCnpj(), refetchType: 'none' });
      }
    },
  });
}
